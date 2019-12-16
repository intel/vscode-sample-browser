import * as vscode from 'vscode';

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import * as request from 'request-promise-native';
import * as spawn from 'promisify-child-process';
import { reporters } from 'mocha';
import { map } from 'bluebird';
import { openSync, fstat } from 'fs';
import { RequiredUriUrl } from 'request';
import { URL } from 'url';

export class SampleProvider implements vscode.TreeDataProvider<Sample> {

    private _onDidChangeTreeData: vscode.EventEmitter<Sample | undefined> = new vscode.EventEmitter<Sample | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Sample | undefined> = this._onDidChangeTreeData.event;
    
    

    refresh(): void {
        this._onDidChangeTreeData.fire();
        
    }

    getTreeItem(element: Sample): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Sample| undefined): vscode.ProviderResult<Sample[]> {
        if (element) {
            return this.getSortedChildren(element);
        } else {
            return this.getIndex();
        }
    }

    create(sample: Sample): void {
        var val = sample.val;
        vscode.window.showSaveDialog({saveLabel: "Create",}).then(folder => {
            if (val && folder) {
                spawn.exec("oneapi-cli create "+val.Path+" "+folder.fsPath).then(output => {
                    vscode.commands.executeCommand("vscode.openFolder",folder, true);
                }) ; //folder is a uri, so just send the path :D
            }
        });
        
        
    }
    show(sample: SampleItem): void {
        let p = path.join(os.tmpdir(), os.userInfo().username ,sample.Path);

        spawn.exec("oneapi-cli create "+sample.Path+" "+p).then(output => {
            let a =  path.join(p,"README.md");
            vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(a),);
        });
    }

    private addSample(key: string[], pos : Map<string, Sample>, ins : SampleItem) {
        if (key.length < 1) {
            //Add Sample
            var add = new Sample(ins.example.Name,vscode.TreeItemCollapsibleState.None, ins.example.Description,ins,undefined,undefined,
            {command: "oneapisamples.show", title: "asd", arguments: [ins]});
            pos.set(ins.Path, add);
            return;
        }
        var cKey = key[0];
        if (!pos.has(key[0])) {
            var newMap = new Map<string, Sample>();
            var addCat = new Sample(key[0],vscode.TreeItemCollapsibleState.Expanded, "",undefined, newMap, "cat");

            pos.set(key[0],addCat);
        }
        key.shift();
        if (cKey) {
            if (pos.get(cKey)) {
                var pos1 : Sample | any = pos.get(cKey);
                if (pos1) {
                     var pos2 : Map<string, Sample> | any  = pos1.children;
                    this.addSample(key, pos2, ins);
                }
                
            }
        }
    }

private async getSortedChildren(node: Sample): Promise<Sample[]> { 
    if (node.children) {
        let r = Array.from(node.children.values());
        return this.sort(r);
    }
    return new Array();
}

private async downloadCLI(): Promise<boolean> {

    //https://gitlab.devtools.intel.com/api/v4/projects/32487/jobs/artifacts/develop/raw/linux/bin/oneapi-cli?job=sign

    const base : string = "https://gitlab.devtools.intel.com/api/v4/projects/32487/jobs/artifacts/r2021.1-beta04/raw/";
    const sBase : string = "/bin/";
    const options : string = "?job=sign";

    let url : string = "";
    let binName : string = "oneapi-cli";

    switch(os.platform()) {
        case "linux": {
            url = base + "linux" + sBase + binName + options;
            break;
        }
        case "win32": {
            binName = "oneapi-cli.exe";
            url = base + "win" + sBase + binName + options;
            break;
        }
        case "darwin": {
            url = base + "osx" + sBase + binName + options;
            break;
        }
        default: {
            return false; //Dump out early we have no business here right now!
        }
    }

    let res: boolean = await request.get({uri: url, resolveWithFullResponse: true, encoding: null}).then(async (response: request.FullResponse) => {

        let cliPath = path.join(os.homedir(), ".oneapi-cli", binName);
        await fs.promises.writeFile(cliPath, response.body).then(async a  => {
                if (os.platform() !== "win32") {
                    fs.chmodSync(cliPath, 0o755);
                }
            });
        return true;
    });

    return false;
}

private async getIndex(): Promise<Sample[]> {

    let CLIrdy : boolean = false;
    await spawn.exec('oneapi-cli version', {}).then(output =>{
        CLIrdy = true;
        return;
    }).catch(async error => { // If we have a problem lets get the CLI from CI/GITHUB/GITLAB
        await vscode.window.showInformationMessage("Required 'oneapi-cli' was not found on the Path, Do you want to download it",{},"Yes", "No").then(async sel => {
            let s : string = <string>sel;
            if (s === "Yes") {
                let res : boolean = await this.downloadCLI();
                CLIrdy = true;
                let cliPath = path.join(os.homedir(), ".oneapi-cli");
                if (os.platform() === "win32") {
                    process.env.PATH = cliPath +";"+ process.env.PATH;
                } else {
                    process.env.PATH = cliPath +":"+ process.env.PATH;

                }
               return;
            }
            
        });
        return;       
    });
    if (!CLIrdy) {
        let bla = new Sample("Samples are not gonna happen",vscode.TreeItemCollapsibleState.None, "",undefined, undefined, "blankO");
        return [bla];

    }

    let resp : SampleItem[] = await spawn.exec('oneapi-cli list -o cpp -j', {}).then(output => JSON.parse(<string>output.stdout)).catch();
    var Items : Sample[] = new Array(resp.length);

    var root = new Map<string,Sample>();

    for (let i of resp) { 
        for (let c of i.example.Categories) {
            var catPath = c.split('/');
            if (catPath[0] = "Toolkit/") {
                catPath.shift();
            }
            this.addSample(catPath, root, i);
        }
    }    
    let r = Array.from(root.values());
    return this.sort(r);
}

private sort(nodes: Sample[]): Sample[] {
    return nodes.sort((n1, n2) => {
        return n1.label.localeCompare(n2.label);
    });
}

}
export interface SampleItem {
        Path: string;
        example: Inner;
}

interface Inner {
    Name: string;
    Description: string;
    Categories: string[];
    sample_readme_uri: string;

}

export class Sample extends vscode.TreeItem {


    constructor(
        public readonly label: string,
        
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public description: string,
        public val?: SampleItem,
        public children? : Map<string,Sample>,
        public contextValue: string = "sample",
        public readonly command?: vscode.Command,
    
    ) {
        super(label,collapsibleState);
    }

    get tooltip(): string {
        return this.description;
    }


    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };


}