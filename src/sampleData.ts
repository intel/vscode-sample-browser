/**
 * Copyright (c) 2020 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as vscode from 'vscode';
import * as fs from 'fs';

import { OneApiCli, SampleContainer } from './oneapicli';

//Fairly basic regex for searching for URLs in a string.
const urlMatch = /(https?:\/\/[^\s]+)/g;

export class SampleTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,

        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public tooltip: string,
        public val?: SampleContainer,
        public children?: Map<string, SampleTreeItem>,
        public contextValue: string = "sample",
        public readonly command?: vscode.Command,

    ) {
        super(label, collapsibleState);
    }

}

export class SampleProvider implements vscode.TreeDataProvider<SampleTreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<SampleTreeItem | undefined> = new vscode.EventEmitter<SampleTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<SampleTreeItem | undefined> = this._onDidChangeTreeData.event;

    private cli: OneApiCli;
    private languages: string[] = [];
    private currentPreviewPath = "";

    constructor() {
        this.cli = this.makeCLIFromConfig();
        vscode.workspace.onDidChangeConfiguration(event => {
            const affected = event.affectsConfiguration("intelOneAPI.samples");
            if (affected) {
                this.updateCLIConfig();
            }
        });
    }

    private makeCLIFromConfig(): OneApiCli {
        const config = vscode.workspace.getConfiguration("intelOneAPI.samples");
        const languageValue: string[] | undefined = config.get('sampleLanguages');

        if (!languageValue || languageValue.length === 0) {
            vscode.window.showErrorMessage("Configured language is empty, Intel oneAPI sample browser cannot operate");
        }
        this.languages = languageValue as string[];

        const cliPath: string | undefined = config.get('pathToCLI');
        const baseURL: string | undefined = config.get('baseURL');
        const ignoreOSFilter: boolean | undefined = config.get("ignoreOsFilter");
        return new OneApiCli(this.askDownloadPermission, cliPath, baseURL, ignoreOSFilter);
    }

    private async updateCLIConfig(): Promise<void> {
        const config = vscode.workspace.getConfiguration("intelOneAPI.samples");
        const languageValue: string[] | undefined = config.get('sampleLanguage');

        if (!languageValue || languageValue.length === 0) {
            vscode.window.showErrorMessage("Configured language is empty, Intel oneAPI sample browser cannot operate");
        }
        this.languages = languageValue as string[];


        const cliPath: string | undefined = config.get('pathToCLI');
        if (cliPath) {
            if (!(await this.cli.setCliPath(cliPath))) {
                console.log("Intel oneAPI Sample Browser: CLI Path rejected");
            }
        }
        const baseURL: string | undefined = config.get('baseURL');
        if (baseURL) {
            this.cli.baseURL = baseURL;
        }
        const ignoreOSFilter: boolean | undefined = config.get("ignoreOsFilter");
        if (ignoreOSFilter) {
            this.cli.ignoreOS = true;
        } else {
            this.cli.ignoreOS = false;
        }
    }

    async refresh(): Promise<void> {
        this._onDidChangeTreeData.fire();
    }
    async clean(): Promise<void> {
        await this.cli.cleanCache();
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
    private linkify(text: string): string {
        return text.replace(urlMatch, url => {
            return `[${url}](${url})`; //Vscode Markdown needs explict href and text
        });
    }

    async create(sample: SampleTreeItem): Promise<void> {
        const val = sample.val;

        //Dependency Check 
        const skipCheck: boolean = vscode.workspace.getConfiguration("intelOneAPI.samples").get('skipDependencyChecks') as boolean;
        if (val?.example.dependencies && !skipCheck) {
            if (!process.env.ONEAPI_ROOT) {
                vscode.window.
                    showWarningMessage("FYI, This sample has a depedency but ONEAPI_ROOT is not set so we can not check if the depdencies are met");

            } else {
                const output = await this.cli.checkDependencies(val.example.dependencies.join());
                if (output !== "") {
                    //Just show output from the CLI as other Browser currently do.
                    const r = await vscode.window.showWarningMessage(this.linkify(output), "Cancel", "Continue");
                    if (r !== "Continue") {
                        return;
                    }
                }
            }
        }

        const folder = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false });
        if (val && folder && folder[0]) { //Check Value for sample creation was passed, and the folder selection was defined.
            if ((await fs.promises.readdir(folder[0].fsPath)).length) {
                const overwrite = await vscode.window.showWarningMessage("The chosen folder is not empty. Creating the sample here *may* overwrite existing file!", { modal: true }, "Continue");
                if (overwrite !== "Continue") {
                    return;
                }
            }
            try {
                await this.cli.createSample(val.language, val.path, folder[0].fsPath);
            }
            catch (e) {
                vscode.window.showErrorMessage(`Sample Creation failed: ${e}`);
                return;
            }
            vscode.commands.executeCommand("vscode.openFolder", folder[0], true);
        }
    }
    async readme(sample: SampleTreeItem): Promise<void> {
        const val = sample.val;
        if (val) {
            vscode.env.openExternal(vscode.Uri.parse(val.example.sample_readme_uri));
        }
    }

    public async askDownloadPermission(): Promise<boolean> {
        const sel = await vscode.window.showQuickPick(["Yes", "No"], { ignoreFocusOut: true, canPickMany: false, placeHolder: "Required 'oneapi-cli' was not found on the Path, Do you want to download it" });
        return (sel === "Yes");
    }

    /**
     * Add sample to tree structure.
     * @param key Key, is the potentential categories i.e [mycategory, mysubcategory]
     * @param pos is the partent element in the tree i.e. the owneing category
     * @param ins Sample to be inserted into tree.
     */
    private addSample(key: string[], pos: Map<string, SampleTreeItem>, ins: SampleContainer): void {
        if (key.length < 1) {
            //Add Sample
            const add = new SampleTreeItem(ins.example.name, vscode.TreeItemCollapsibleState.None, ins.example.description, ins, undefined, undefined,
                { command: "intel.oneAPISamples.show", title: "", arguments: [ins] });
            pos.set(ins.path, add);
            return;
        }
        const cKey = key.shift();
        if (cKey) {
            if (!pos.has(cKey)) {
                const newMap = new Map<string, SampleTreeItem>();
                const addCat = new SampleTreeItem(cKey, vscode.TreeItemCollapsibleState.Collapsed, "", undefined, newMap, "cat");
                pos.set(cKey, addCat);
            }
            const category: SampleTreeItem | undefined = pos.get(cKey);
            if (category) {
                const children: Map<string, SampleTreeItem> | undefined = category.children;
                if (children) {
                    this.addSample(key, children, ins);
                }
            }
        }
    }

    private async getSortedChildren(node: SampleTreeItem): Promise<SampleTreeItem[]> {
        if (node.children) {
            const r = Array.from(node.children.values());
            return this.sort(r);
        }
        return [];
    }


    private async getIndex(): Promise<SampleTreeItem[]> {
        const success = await this.cli.ready.catch(() => false);
        if (!success) {
            vscode.window.showErrorMessage("Unable to find oneapi-cli or download it");
            const fail = new SampleTreeItem("Unable to find oneapi-cli or download it", vscode.TreeItemCollapsibleState.None, "", undefined, undefined, "blankO");
            return [fail];
        }
        const root = new Map<string, SampleTreeItem>();

        for (const l of this.languages) {
            let sampleArray: SampleContainer[] = [];
            try {
                sampleArray = await this.cli.fetchSamples(l);
            }
            catch (e) {
                vscode.window.showErrorMessage(`Failed to fetch langauge ${l} from the CLI: ${e}`);
                continue; // Skip adding the node of this langauge
            }

            if (sampleArray.length === 0) {
                continue; //Skip adding the node of this langauge, the reponse was empty
            }

            const newMap = new Map<string, SampleTreeItem>();
            const languageRoot = new SampleTreeItem(l, vscode.TreeItemCollapsibleState.Expanded, "", undefined, newMap, "cat");
            root.set(l, languageRoot);
            for (const sample of sampleArray) {
                if (!sample.example.categories || sample.example.categories.length === 0) {
                    sample.example.categories = ["Other"];
                }
                for (const categories of sample.example.categories) {
                    const catPath = categories.split('/');
                    if (catPath[0] === "Toolkit") {
                        catPath.shift();
                    }
                    this.addSample(catPath, newMap, sample);
                }
            }

        }

        const tree = Array.from(root.values());
        return this.sort(tree);
    }

    private sort(nodes: SampleTreeItem[]): SampleTreeItem[] {
        return nodes.sort((n1, n2) => {
            return n1.label.localeCompare(n2.label);
        });
    }

}
