import * as vscode from 'vscode';

import * as path from 'path';

import * as request from 'request-promise-native';
import * as spawn from 'promisify-child-process';
import { reporters } from 'mocha';
import { map } from 'bluebird';

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


    private addSample(key: string[], pos : Map<string, Sample>, ins : SampleItem) {
        if (key.length < 1) {
            //Add Sample
            var add = new Sample(ins.example.Name,vscode.TreeItemCollapsibleState.None, ins.example.Description);
            pos.set(ins.path, add);
            return;
        }
        var cKey = key[0];
        if (!pos.has(key[0])) {
            var newMap = new Map<string, Sample>();
            var addCat = new Sample(key[0],vscode.TreeItemCollapsibleState.Collapsed, "", newMap);
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

private async getIndex(): Promise<Sample[]> {


    let resp : SampleItem[] = await spawn.exec('oneapi-cli list -o cpp -j', {}).then(output => JSON.parse(<string>output.stdout));

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
interface SampleItem {
        path: string;
        example: Inner;
}

interface Inner {
    Name: string;
    Description: string;
    Categories: string[];

}

export class Sample extends vscode.TreeItem {


    constructor(
        public readonly label: string,
        
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public description: string,
        public children? : Map<string,Sample>,
        public readonly command?: vscode.Command,
    
    ) {
        super(label,collapsibleState);
    }

    get tooltip(): string {
        return this.label;
    }


    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

    contextValue = 'sample';

}