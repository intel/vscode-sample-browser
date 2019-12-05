
import * as vscode from 'vscode';
import { SampleProvider, Sample } from './upmData';

export function activate(context: vscode.ExtensionContext) {
		const upmData = new SampleProvider();
		vscode.window.registerTreeDataProvider('upmLibs', upmData);
		vscode.commands.registerCommand('oneapisamples.create', (sample: Sample) => upmData.create(sample));
}

export function deactivate() {}
