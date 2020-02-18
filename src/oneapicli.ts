/**
 * Copyright (c) 2020 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import util = require('util');
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
 +---------->+  (could be an explict path, or uses first on PATH)|
 |           +--------------------------------------+------------+
 |                                                  |
 |Found                 Not Found                   | Found
 |Explict path to bin set                           | Version on STDOUT
 |                                                  v
 |       +---------------------------+     +--------+-----------------+
 |       |Check in $HOME/.oneapi-cli |     | Check version is greater |  Compatible
 +-------+                           |     | than minumum             +---+
         +----------+----------------+     +--------------------------+   |
                    |                                                     |
                    v  Not found                                +---------v----+
      +---------------------------------+   No                  |Success. Done!|
      | Ask User for download permission+---+                   +---+----------+
      +---------------------------------+   |                       ^
                                            v                       |Download good.
                                        +---+------+                |Explict path to bin set
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
const cliBinName = "oneapi-cli";

//Minimum support version of the CLI that supports this interface
const requiredCliVersion = "0.0.13";

export class OneApiCli {

    public ready: Promise<void>;

    constructor(
        private downloadPermissionCb: () => Promise<boolean>,
        private cli?: string,
        public baseURL?: string,
    ) {
        if ((!cli) || cli === "") {
            this.cli = cliBinName;
        } else {
            if (!this.setCliPath(cli)) {
                throw(new Error("oneapi-cli passed is not valid"));
            }
        }
        this.ready = new Promise(async (resolve, reject) => {
            //This first attempt will either use the explict path try to use
            //a cli from the PATH
            let version = await this.getCliVersion(this.cli as string).catch();
            if (version && this.compareVersion(version)) {
                resolve();
                return;
            }
            const cliHomePath = path.join(os.homedir(), ".oneapi-cli", cliBinName);

            version = await this.getCliVersion(cliHomePath);
            if (version && this.compareVersion(version)) {
                this.cli = cliHomePath;
                resolve();
                return;
            }

            //OK so no local verison found. Lets go download.
            if (await this.downloadPermissionCb()) {
                const path = await this.downloadCli();
                if (path === "") {
                    reject();
                    return;
                }
                version = await this.getCliVersion(path);
                if (version && this.compareVersion(version)) {
                    this.cli = path;
                    resolve();
                    return;
                }
                //Somehow if we get here, the Downloaded CLI version is not compatible.

            }

            reject();

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
        let extraArg = "";
        if ((this.baseURL) && this.baseURL !== "") {
            extraArg = ` --url="${this.baseURL}"`;
        }
        const output = await exec(this.cli + ' list -j -o ' + language + extraArg, {});
        return JSON.parse(output.stdout);
    }

    public async cleanCache(): Promise<void> {
        await exec(this.cli + ' clean', {});
    }

    public async checkDependencies(deps: string): Promise<string> {
        try {
            const p2 = await exec(this.cli + ' check --deps="' + deps + '"', {});
            return p2.stdout as string;

        } catch (e) {
            return e.stdout;
        }
    }

    public async createSample(sample: string, folder: string): Promise<void> {
        return await exec(`${this.cli} create "${sample}" "${folder}"`);
    }

    //Return true if the version passed is greater than the min
    private compareVersion(version: string): boolean {

        const v = semver.coerce(version)?.version as string; //Coerce into simple 0.0.0      
        return semver.gte(v, requiredCliVersion);
    }

    private async getCliVersion(exe: string): Promise<string> {
        try {
            const a = await exec(exe + " version", {});
            if (a.stdout) {
                return semver.clean(a.stdout.toString(), { includePrerelease: true }) as string;
            }
            return "";
        }
        catch (e) {
            return "";
        }
    }

    private async downloadCli(): Promise<string> {

        let CiOs = ""; //OS String as in CI
        let binSuffix = "";

        switch (os.platform()) {
            case "linux": {
                CiOs = "linux";
                break;
            }
            case "win32": {
                CiOs = "win";
                binSuffix = ".exe";
                break;
            }
            case "darwin": {
                CiOs = "osx";
                break;
            }
            default: {
                return ""; //Dump out early we have no business here right now!
            }
        }

        const OsBin: string = cliBinName + binSuffix;

        const url =
            `https://gitlab.devtools.intel.com/api/v4/projects/32487/jobs/artifacts/r2021.1-beta05/raw/${CiOs}/bin/${OsBin}?job=sign`;


        const installdir = path.join(os.homedir(), ".oneapi-cli");
        const cliPath = path.join(installdir, OsBin);

        const downloadAndWrite = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(url);
                const cliBody = fs.createWriteStream(cliPath, { mode: 0o755 });
                cliBody.on('finish', resolve);
                cliBody.on("error", reject);
                response.body.pipe(cliBody);
            }
            catch (e) {
                reject();
            }
        });

        await downloadAndWrite;
        return cliPath;
    }
}

export interface SampleContainer {
    path: string;
    example: Sample;
}

export interface Sample {
    name: string;
    description: string;
    categories: string[];
    dependencies: string[];
    sample_readme_uri: string;

}