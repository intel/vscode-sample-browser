
import * as vscode from 'vscode';
import { SampleProvider, Sample, SampleItem } from './upmData';

export function activate(context: vscode.ExtensionContext) {
		const upmData = new SampleProvider();
		vscode.window.registerTreeDataProvider('upmLibs', upmData);
		vscode.commands.registerCommand('oneapisamples.create', (sample: Sample) => upmData.create(sample));

		vscode.commands.registerCommand('oneapisamples.show', (sample: SampleItem) => upmData.show(sample));

}

export function deactivate() {}
