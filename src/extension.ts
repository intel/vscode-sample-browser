/**
 * Copyright (c) 2020 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as vscode from 'vscode';
import { SampleQuickItem } from './quickpick';
import { SampleProvider, SampleTreeItem } from './sampleData';

export function activate(context: vscode.ExtensionContext): void{
		const sampleData = new SampleProvider();
		context.subscriptions.push(vscode.window.createTreeView("intel.oneAPISamples.tree", {treeDataProvider: sampleData, showCollapseAll: true}));
		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.create', (sample: SampleTreeItem) => sampleData.create(sample)));
	    context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.readme', (sample: SampleTreeItem) => sampleData.readme(sample)));

		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.clean', () => sampleData.clean()));
		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.refresh', () => sampleData.refresh()));

		const qp  = vscode.window.createQuickPick<SampleQuickItem>();
		qp.matchOnDetail = true;
		qp.title = "Intel oneAPI Code Samples";

		context.subscriptions.push(qp);

		context.subscriptions.push(vscode.commands.registerCommand('intel.oneAPISamples.quickpick', async () => {
			qp.show();
			qp.placeholder = "Loading Samples!";
			qp.busy = true;
			if (sampleData.SampleQuickItems.length === 0) {
				await sampleData.getChildren(); //make sure the tree is ready.
			}
			//sort the items
			sampleData.SampleQuickItems.sort((a, b) => {
				if (a.label < b.label) {
					return -1;
				}
				return 0;
			});

			qp.placeholder = "Select a Sample";
			qp.busy = false;
			qp.items = sampleData.SampleQuickItems;
		}));

		qp.onDidChangeSelection(async selection => {
			if (selection[0]) {
				qp.hide();
				const cmd = await vscode.window.showQuickPick(["Create Sample", "Open Sample Readme"],{canPickMany: false,title: "Choose command for sample"});
				if (cmd === "Create Sample") {
					sampleData.create(new SampleTreeItem("", vscode.TreeItemCollapsibleState.Collapsed, "",selection[0].sample, undefined));
				} else {
					sampleData.readme(new SampleTreeItem("", vscode.TreeItemCollapsibleState.Collapsed, "",selection[0].sample, undefined));
				}
			}
		});
}

export function deactivate(): void {
	console.log("Intel oneAPI Sample Browser: Goodbye");
}