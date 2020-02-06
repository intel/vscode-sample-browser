
import * as vscode from 'vscode';
import { SampleProvider, SampleTreeItem } from './sampleData';
import {SampleContainer} from './oneapicli';

export function activate(context: vscode.ExtensionContext) {
		const sampleData = new SampleProvider();
		//vscode.window.registerTreeDataProvider('upmLibs', upmData);
		vscode.window.createTreeView("intel.oneAPISamples.tree", {treeDataProvider: sampleData, showCollapseAll: true});
		vscode.commands.registerCommand('intel.oneAPISamples.create', (sample: SampleTreeItem) => sampleData.create(sample));
		vscode.commands.registerCommand('intel.oneAPISamples.show', (sample: SampleContainer) => sampleData.show(sample));
		vscode.commands.registerCommand('intel.oneAPISamples.clean', () => sampleData.clean());
		vscode.commands.registerCommand('intel.oneAPISamples.refresh', () => sampleData.refresh());
}

export function deactivate() {}