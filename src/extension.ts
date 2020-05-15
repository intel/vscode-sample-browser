/**
 * Copyright (c) 2020 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as vscode from 'vscode';
import { SampleProvider, SampleTreeItem } from './sampleData';

export function activate(context: vscode.ExtensionContext): void{
		const sampleData = new SampleProvider();
		context.subscriptions.push(vscode.window.createTreeView("intel.oneAPISamples.tree", {treeDataProvider: sampleData, showCollapseAll: true}));
		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.create', (sample: SampleTreeItem) => sampleData.create(sample)));
	    context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.readme', (sample: SampleTreeItem) => sampleData.readme(sample)));

		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.clean', () => sampleData.clean()));
		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.refresh', () => sampleData.refresh()));
}

export function deactivate(): void {
	console.log("Intel oneAPI Sample Browser: Goodbye");
}