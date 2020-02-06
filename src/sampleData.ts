import * as vscode from 'vscode';

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { OneAPICLI, SampleContainer } from './oneapicli';
import { isRegExp } from 'util';
import { fstat } from 'fs';

export class SampleProvider implements vscode.TreeDataProvider<SampleTreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<SampleTreeItem | undefined> = new vscode.EventEmitter<SampleTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<SampleTreeItem | undefined> = this._onDidChangeTreeData.event;

    private cli = new OneAPICLI(this.askDownloadPermission);
    private outChannel = vscode.window.createOutputChannel("Intel oneAPI Sample");
    private language : string = "";

    constructor() {
        this.updateCLIConfig();
    }

    private updateCLIConfig() {
        let config = vscode.workspace.getConfiguration("inteloneapi.samples");
        let l: string | undefined= config.get('sampleLanguage');

        if (!l || l === "") {
            vscode.window.showErrorMessage("Configured language is empty, Intel oneAPI sample browser cannot operate");
        }
        this.language = <string>l;

        
        let cliPath :string | undefined = config.get('pathToCLI');
        if (cliPath) {{
            this.cli.cli = cliPath;
        }}
        let baseURL : string |undefined = config.get('baseURL');
        if (baseURL) { //todo reset
            this.cli.baseURL = baseURL;
        }        
    }


    refresh(): void {
        this.updateCLIConfig();
        this._onDidChangeTreeData.fire();

    }
    clean(): void {

        this.cli.CleanCache();
        this.cli.baseURL = "http://iotdk-ninja.amr.corp.intel.com/samples-staging/iss2019-update3/";
        this.refresh();

    }


    getTreeItem(element: SampleTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SampleTreeItem | undefined): vscode.ProviderResult<SampleTreeItem[]> {
        if (element) {
            return this.getSortedChildren(element);
        } else {
            return this.getIndex();
        }
    }

    async create(sample: SampleTreeItem): Promise<void> {
        var val = sample.val;
        let skipCheck : boolean = <boolean> vscode.workspace.getConfiguration("inteloneapi.samples").get('skipDependencyChecks');
        if (val?.example.dependencies && !skipCheck) {
            if (!process.env.ONEAPI_ROOT) {
                vscode.window.showWarningMessage("FYI, this sample has a depedency but ONEAPI_ROOT is not set so we can not check if the depdencies are met");

            } else {
                let cancel: boolean = false;
                await this.cli.CheckDependencies(val.example.dependencies.join()).then(async output => {
                    if (output === "") {
                        //this.outChannel.hide();
                        return;
                    }
                    //"The Sample you are creating has unmet dependencies. Do you want to"
                    await vscode.window.showWarningMessage(output, "Cancel", "Continue")
                        .then(async selected => {
                            
                            if (selected === "Cancel") {

                                cancel = true;
                                return;
                            }


                        });
                });
                if (cancel) {
                    return;
                }
            }


        }



        vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false }).then(folder => {
            if (val && folder && folder[0]) {
                this.cli.CreateSample(val.path, folder[0].fsPath).then(() => {
                    vscode.commands.executeCommand("vscode.openFolder", folder[0], true);


                });

            }
        });
        //vscode.window.showSaveDialog({saveLabel: "Create",})


    }
    show(sample: SampleContainer): void {
        let p = path.join(os.tmpdir(), os.userInfo().username, sample.path);

        this.cli.CreateSample(sample.path, p).then(() => {
            let a = path.join(p, "README.md");
            vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(a));



        });

    }

    public async askDownloadPermission(): Promise<boolean> {
        let dl: boolean = false;
        await vscode.window.showInformationMessage("Required 'oneapi-cli' was not found on the Path, Do you want to download it", {}, "Yes", "No").then(async sel => {
            let s: string = <string>sel;
            if (s === "Yes") {
                dl = true;
            }
        });
        return dl;
    }

    private addSample(key: string[], pos: Map<string, SampleTreeItem>, ins: SampleContainer) {
        if (key.length < 1) {
            //Add Sample
            var add = new SampleTreeItem(ins.example.name, vscode.TreeItemCollapsibleState.None, ins.example.description, ins, undefined, undefined,
                { command: "intel.oneAPISamples.show", title: "", arguments: [ins] });
            pos.set(ins.path, add);
            return;
        }
        var cKey = key[0];
        if (!pos.has(key[0])) {
            var newMap = new Map<string, SampleTreeItem>();
            var addCat = new SampleTreeItem(key[0], vscode.TreeItemCollapsibleState.Expanded, "", undefined, newMap, "cat");

            pos.set(key[0], addCat);
        }
        key.shift();
        if (cKey) {
            if (pos.get(cKey)) {
                var pos1: SampleTreeItem | any = pos.get(cKey);
                if (pos1) {
                    var pos2: Map<string, SampleTreeItem> | any = pos1.children;
                    this.addSample(key, pos2, ins);
                }

            }
        }
    }

    private async getSortedChildren(node: SampleTreeItem): Promise<SampleTreeItem[]> {
        if (node.children) {
            let r = Array.from(node.children.values());
            return this.sort(r);
        }
        return new Array();
    }


    private async getIndex(): Promise<SampleTreeItem[]> {
        let clierror: boolean = false;
        await this.cli.Ready.catch(() => {
            clierror = true;

        });
        if (clierror) {
            vscode.window.showErrorMessage("Unable to find oneapi-cli or download it");
            let fail = new SampleTreeItem("Unable to find oneapi-cli or download it", vscode.TreeItemCollapsibleState.None, "", undefined, undefined, "blankO");
            return [fail];

        }

        
        let resp: SampleContainer[] = await this.cli.FetchSamples(this.language);
        var Items: SampleTreeItem[] = new Array(resp.length);

        var root = new Map<string, SampleTreeItem>();

        for (let i of resp) {
            for (let c of i.example.categories) {
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

    private sort(nodes: SampleTreeItem[]): SampleTreeItem[] {
        return nodes.sort((n1, n2) => {
            return n1.label.localeCompare(n2.label);
        });
    }

}


export class SampleTreeItem extends vscode.TreeItem {


    constructor(
        public readonly label: string,

        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public description: string,
        public val?: SampleContainer,
        public children?: Map<string, SampleTreeItem>,
        public contextValue: string = "sample",
        public readonly command?: vscode.Command,

    ) {
        super(label, collapsibleState);
    }

    get tooltip(): string {
        return this.description;
    }


    // iconPath = {
    //     light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    //     dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    // };


}