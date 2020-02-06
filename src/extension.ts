
import * as vscode from 'vscode';
import { SampleProvider, SampleTreeItem } from './sampleData';
import {SampleContainer} from './oneapicli';

export function activate(context: vscode.ExtensionContext) {
		const sampleData = new SampleProvider();
		//vscode.window.registerTreeDataProvider('upmLibs', upmData);
		vscode.window.createTreeView("oneapisamples.cpp", {treeDataProvider: sampleData, showCollapseAll: true});
		vscode.commands.registerCommand('oneapisamples.create', (sample: SampleTreeItem) => sampleData.create(sample));
		vscode.commands.registerCommand('oneapisamples.show', (sample: SampleContainer) => sampleData.show(sample));
		vscode.commands.registerCommand('oneapisamples.clean', () => sampleData.clean());
		vscode.commands.registerCommand('oneapisamples.refresh', () => sampleData.refresh());

}

export function deactivate() {}