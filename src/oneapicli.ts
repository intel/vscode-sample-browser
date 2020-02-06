/**
 * Copyright (c) 2020 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import * as child from 'promisify-child-process';
import * as request from 'request-promise-native';
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

//Expeted CLI binary name
const cliBinName = "oneapi-cli";

//Minimum support version of the CLI that supports this interface
const requiredCLIVersion = "0.0.13";

export class OneAPICLI {

    public Ready: Promise<any>;

    constructor(
        private downloadPermissionCb: () => Promise<boolean>,
        public cli? :string,
        public baseURL?: string,
    ) {
        if ((!cli) || cli === "") {
            this.cli = cliBinName;
        }
        this.Ready = new Promise(async (resolve, reject) => {
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
                if (await this.downloadCLI().catch(() => {reject();})) {
                    this.cli = cliHomePath;
                    resolve();
                    return;
                }

            }
            
            reject();

        });
        return;        
    }

    public async FetchSamples(language : string):Promise<SampleContainer[]> {
        let extraArg: string = "";
        if ((this.baseURL) && this.baseURL !== "") {
            extraArg = ' --url="' + this.baseURL + '"'; //rembember an extra space :/
        }
        return await child.exec(this.cli + ' list -j -o ' + language + extraArg, {}).then(output => JSON.parse(<string>output.stdout)).catch();
    }

    public async CleanCache() {
        await child.exec(this.cli + ' clean', {});
    }


    public async CheckDependencies(deps: string): Promise<string> {
        let response: string = "";
       
        
        await child.exec(this.cli + ' check --deps="' + deps +'"', {}).then(output => {
            response = <string> output.stdout;
        }).catch(output => {
            response = output.stdout;
            return;
            

        });

        return response;

    }

    public CreateSample(sample: string, folder: string) {
        return child.exec(this.cli + " create "+sample+" "+folder);
    }

    //Return true if the version passed is greater than the min
    private compareVersion(version: string) {
    
        let v = <string> semver.coerce(version)?.version; //Coerce into simple 0.0.0      
        return semver.gte(v, requiredCLIVersion);
    }

    private async getCLIVersion(exe:string ): Promise<string> {
        let version: string = "";
        try {
             version  = <string> await child.exec(exe + " version", {}).then(output =>{
                return semver.clean(<string>output.stdout, {includePrerelease: true});
            });

        }

        finally{
            return version;
        }
        
    }

    //Unused right now
    private addPath(path: string): void {
        if (os.platform() === "win32") {
            process.env.PATH = path +";"+ process.env.PATH;
        } else {
            process.env.PATH = path +":"+ process.env.PATH;
        }
    }

    private async downloadCLI(): Promise<boolean> {

        const base : string = "https://gitlab.devtools.intel.com/api/v4/projects/32487/jobs/artifacts/r2021.1-beta05/raw/";
        const sBase : string = "/bin/";
        const options : string = "?job=sign";
    
        let url : string = "";
   
        switch(os.platform()) {
            case "linux": {
                url = base + "linux" + sBase + cliBinName + options;
                break;
            }
            case "win32": {
                url = base + "win" + sBase + cliBinName + ".exe" + options;
                break;
            }
            case "darwin": {
                url = base + "osx" + sBase + cliBinName + options;
                break;
            }
            default: {
                return false; //Dump out early we have no business here right now!
            }
        }
    
        let res: boolean = await request.get({uri: url, resolveWithFullResponse: true, encoding: null}).then(async (response: request.FullResponse) => {
    
            let installdir = path.join(os.homedir(), ".oneapi-cli");
            if (!fs.existsSync(installdir)){
                fs.mkdirSync(installdir);
            }
            let cliPath = path.join(installdir, cliBinName);
            await fs.promises.writeFile(cliPath, response.body).then(async a  => {
                    if (os.platform() !== "win32") {
                        fs.chmodSync(cliPath, 0o755);
                    }
                });
            return true;
        });
    
        return res;
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