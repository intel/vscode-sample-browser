/**
 * Copyright (c) 2021 Intel Corporation
 * Licensed under the MIT License. See the project root LICENSE
 * 
 * SPDX-License-Identifier: MIT
 */

import * as vscode from 'vscode';
import { SampleContainer } from './oneapicli';

export class SampleQuickItem implements vscode.QuickPickItem {
    label: string;
    description: string;
    detail: string;
    public sample: SampleContainer;
    

    constructor(c: SampleContainer) {
        this.sample = c;
        this.label = c.example.name;
        this.description = c.language;
        this.detail = c.example.description;
    }
}