
import * as vscode from 'vscode';
import { SampleProvider } from './upmData';

export function activate(context: vscode.ExtensionContext) {
		const upmData = new SampleProvider();
		vscode.window.registerTreeDataProvider('upmLibs', upmData);

}

export function deactivate() {}
