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
//import * as child from 'promisify-child-process';
import * as semver from 'semver';
import { ChildProcess } from 'child_process';

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

//Expeted CLI binary name
const cliBinName = "oneapi-cli";

//Minimum support version of the CLI that supports this interface
const requiredCliVersion = "0.0.13";

export class OneApiCli {

    public ready: Promise<any>;

    constructor(
        private downloadPermissionCb: () => Promise<boolean>,
        public cli?: string,
        public baseURL?: string,
    ) {
        if ((!cli) || cli === "") {
            this.cli = cliBinName;
        }
        this.ready = new Promise(async (resolve, reject) => {
            //This first attempt will either use the explict path try to use
            //a cli from the PATH
            let version = await this.getCLIVersion(<string>this.cli).catch();
            if (version && this.compareVersion(version)) {
                resolve();
                return;
            }
            let cliHomePath = path.join(os.homedir(), ".oneapi-cli", cliBinName);

            if (fs.existsSync(cliHomePath)) {
                version = await this.getCLIVersion(cliHomePath);
                if (version && this.compareVersion(version)) {
                    this.cli = cliHomePath;
                    resolve();
                    return;
                }
            }

            //OK so no local verison found. Lets go download.
            if (await this.downloadPermissionCb()) {
                let path = await this.downloadCli();
                if (path === "") {
                    reject();
                    return;
                }
                version = await this.getCLIVersion(path);
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

    public async fetchSamples(language: string): Promise<SampleContainer[]> {
        let extraArg: string = "";
        if ((this.baseURL) && this.baseURL !== "") {
            extraArg = ` --url="${this.baseURL}"`;
        }
        let output = await exec(this.cli + ' list -j -o ' + language + extraArg, {});
        return JSON.parse(output.stdout);
    }

    public async cleanCache() {
        await exec(this.cli + ' clean', {});
    }

    public async checkDependencies(deps: string): Promise<string> {
        try {
            // let p = await child.exec(this.cli + ' check --deps="' + deps + '"', {});
            // //return <string>p.stdout;//
            let p2 = await exec(this.cli + ' check --deps="' + deps + '"', {});
            return <string>p2.stdout;

        } catch (e) {
            return e.stdout;

        }
    }

    public createSample(sample: string, folder: string) {
        return exec(this.cli + " create " + sample + " " + folder);
    }

    //Return true if the version passed is greater than the min
    private compareVersion(version: string) {

        let v = <string>semver.coerce(version)?.version; //Coerce into simple 0.0.0      
        return semver.gte(v, requiredCliVersion);
    }

    private async getCLIVersion(exe: string): Promise<string> {
        try {
            let a = await exec(exe + " version", {});
            if (a.stdout) {
                return <string>semver.clean(a.stdout.toString(), { includePrerelease: true });
            }
            return "";
        }
        catch (e) {
            return "";
        }
    }

    private async downloadCli(): Promise<string> {

        let CiOs: string = ""; //OS String as in CI
        let binSuffix: string = "";

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

        let OsBin: string = cliBinName + binSuffix;

        let url: string =
            `https://gitlab.devtools.intel.com/api/v4/projects/32487/jobs/artifacts/r2021.1-beta05/raw/${CiOs}/bin/${OsBin}?job=sign`;


        let installdir = path.join(os.homedir(), ".oneapi-cli");
        let cliPath = path.join(installdir, OsBin);

        let downloadAndWrite = new Promise(async (resolve, reject) => {
            try {
                let response = await fetch(url);
                let cliBody = fs.createWriteStream(cliPath, { mode: 0o755 });
                cliBody.on('finish', resolve);
                cliBody.on("error", reject);
                response.body.pipe(cliBody);
            }
            catch (e) {
                reject();
            }
        });

        await downloadAndWrite;



        //let response: request.FullResponse = await request.get({ uri: url, resolveWithFullResponse: true, encoding: null });


        //await fs.promises.mkdir(installdir, 0o755);

        // await fs.promises.writeFile(cliPath, response.body);
        // if (os.platform() !== "win32") {
        //     await fs.promises.chmod(cliPath, 0o755);
        // }

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