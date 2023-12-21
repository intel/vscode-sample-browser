/**
 * Copyright (c) 2020 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';


import util = require('util');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = util.promisify(require('child_process').exec);
import fetch from 'node-fetch';
import * as semver from 'semver';

/** 
OneAPI-Interface in Typescript

                                  Start
                                     +
                                     |
             +-----------------------v---------------------------+
             |             "oneapi-cli version" ran              |
 +---------->+ (could be an explicit path, or uses first on PATH)|
 |           +--------------------------------------+------------+
 |                                                  |
 |Found                 Not Found                   | Found
 |Explicit path to bin set                          | Version on STDOUT
 |                                                  v
 |       +---------------------------+     +--------+-----------------+
 |       |Check in $HOME/.oneapi-cli |     | Check version is greater |  Compatible
 +-------+                           |     | than minimum             +---+
         +----------+----------------+     +--------------------------+   |
                    |                                                     |
                    v  Not found                                +---------v----+
      +---------------------------------+   No                  |Success. Done!|
      | Ask User for download permission+---+                   +---+----------+
      +---------------------------------+   |                       ^
                                            v                       |Download good.
                                        +---+------+                |Explicit path to bin set
                                        | !Failed! |                |
                                        +---+------+                |
                                            ^                       |
                                            |                       |
     +---------------------------------+    | Download failure      |
     + Downloaded to $HOME/.oneapi-cli +----+                       |
     |                                 +----------------------------+
     +---------------------------------+  
*/

//Expected CLI binary name
const cliBinName = 'oneapi-cli';

//Minimum support version of the CLI that supports this interface
const requiredCliVersion = '0.1.1';

//Base path where the CLI can be downloaded from
const baseBinPath = 'https://github.com/intel/oneapi-cli/releases/latest/download';

export class OneApiCli {

    public ready: Promise<boolean>;

    constructor(
        private downloadPermissionCb: () => Promise<boolean>,
        private cli?: string,
        public baseURL?: string,
        public ignoreOS?: boolean,
    ) {
        if ((!cli) || cli === '') {
            this.cli = cliBinName;
        } else {
            if (!this.setCliPath(cli)) {
                throw (new Error('oneapi-cli passed is not valid'));
            }
        }
        if (!ignoreOS) {
            this.ignoreOS = false;
        }
        this.ready = new Promise<boolean>(async (resolve) => {
            //This first attempt will either use the explicit path try to use
            //a cli from the PATH
            let version = await this.getCliVersion(this.cli as string).catch();

            if (version && this.compareVersion(version)) {
                resolve(true);
                return;
            }
            const cliHomePath = path.join(os.homedir(), '.oneapi-cli', cliBinName);

            version = await this.getCliVersion(cliHomePath);
            if (version && this.compareVersion(version)) {
                this.cli = cliHomePath;
                resolve(true);
                return;
            }

            //OK so no local version found. Lets go download.
            if (await this.downloadPermissionCb()) {
                const path = await this.downloadCli();

                if (path === '') {
                    resolve(false);
                    return;
                }
                version = await this.getCliVersion(path);
                if (version && this.compareVersion(version)) {
                    this.cli = path;
                    resolve(true);
                    return;
                }
                //Somehow if we get here, the Downloaded CLI version is not compatible.

            }

            resolve(false);

        });
        return;
    }


    /**
     * Sets the oneapi-cli path, Will return false if path is not valid/executable
     * @param cliPath Path to oneapi-cli
     */
    public async setCliPath(cliPath: string): Promise<boolean> {
        try {
            //X_OK on windows will just do a F_OK
            await fs.promises.access(cliPath, fs.constants.X_OK);
        }
        catch (e) {
            return false;
        }
        this.cli = cliPath;
        return true;
    }

    public async fetchSamples(language: string): Promise<SampleContainer[]> {
        let extraArg = '';

        if ((this.baseURL) && this.baseURL !== '') {
            extraArg = ` --url="${this.baseURL}"`;
        }
        if (this.ignoreOS) {
            extraArg = `${extraArg} --ignore-os`;
        }
        const cmd = '"' + this.cli + '"' + ' list -j -o ' + language + extraArg;
        const output = await exec(cmd, {});

        let recv: SampleContainer[] = [];

        try {
            recv = JSON.parse(output.stdout);
        } catch (e) {
            return recv;
        }
        //add language reference to sample
        for (const sample of recv) {
            sample.language = language;
        }
        return recv;
    }

    public async cleanCache(): Promise<void> {
        const cmd = '"' + this.cli + '"' + ' clean';

        await exec(cmd, {});
    }

    public async checkDependencies(deps: string): Promise<string> {
        try {
            const cmd = '"' + this.cli + '"' + ' check --deps="' + deps + '"';
            const p2 = await exec(cmd, {});

            return p2.stdout as string;

        } catch (e: any) {
            return e.stdout;
        }
    }

    public async createSample(language: string, sample: string, folder: string): Promise<void> {
        const cmd = `"${this.cli}" create -s "${language}" "${sample}" "${folder}"`;

        return await exec(cmd);
    }

    //Return true if the version passed is greater than the min
    private compareVersion(version: string): boolean {

        const v = semver.coerce(version)?.version as string; //Coerce into simple 0.0.0      

        return semver.gte(v, requiredCliVersion);
    }

    private async getCliVersion(exe: string): Promise<string> {
        try {
            const cmd = '"' + exe + '"' + ' version';
            const a = await exec(cmd, {});

            if (a.stdout) {
                return semver.clean(a.stdout.toString(), { includePrerelease: true } as semver.RangeOptions) as string;
            }
            return '';
        }
        catch (e) {
            return '';
        }
    }

    private async downloadCli(): Promise<string> {
        let builtOS = ''; //OS String as in CI
        let binSuffix = '';

        switch (os.platform()) {
            case 'darwin':
            case 'linux':
                builtOS = os.platform();
                break;
            case 'win32': {
                builtOS = 'windows';
                binSuffix = '.exe';
                break;
            }
            default: {
                return ''; //Dump out early we have no business here right now!
            }
        }

        const assetPath = `${cliBinName}-${builtOS}${binSuffix}`;

        const url = `${baseBinPath}/${assetPath}`;

        const OsBin: string = cliBinName + binSuffix;

        const installdir = path.join(os.homedir(), '.oneapi-cli');
        const cliPath = path.join(installdir, OsBin);

        try {
            await fs.promises.mkdir(installdir);
        } catch (err: any) {
            if (err.code !== 'EEXIST') {
                console.log(err);
            }
        }

        try {

            const response = await fetch(url);
            const sumResponse = await fetch(url + '.sha384');
            const hasher = crypto.createHash('sha384', { encoding: 'utf8' });

            const bin = await response.buffer();

            hasher.update(bin);

            const srcSum = (await sumResponse.buffer()).toString().split('\n')[0];
            const dlSum = hasher.digest('hex').toString();


            if (srcSum !== dlSum) {

                console.log('Intel oneAPI sample: The downloaded cli did not match the expect downloaded sha384 sum');
                return '';
            }

            await fs.promises.writeFile(cliPath, bin, { mode: 0o755 });
        }
        catch (e) {
            return '';
        }

        return cliPath;
    }
}

export interface SampleContainer {
    path: string;
    example: Sample;
    language: string;
}

export interface Sample {
    name: string;
    description: string;
    categories: string[];
    dependencies: string[];
    sample_readme_uri: string;

}