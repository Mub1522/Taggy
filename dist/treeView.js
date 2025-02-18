"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaggyTreeDataProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class TaggyTreeDataProvider {
    constructor(tagsFilePath) {
        this.tagsFilePath = tagsFilePath;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.aditionalFilter = "";
    }
    getTreeItem(element) {
        return element;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getChildren() {
        const tags = JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));
        console.log(tags);
        return Object.keys(tags)
            .filter((filePath) => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders)
                return false;
            const rootPath = workspaceFolders[0].uri.fsPath;
            return filePath.startsWith(rootPath);
        })
            .filter((filePath) => {
            if (!this.aditionalFilter)
                return true;
            const tag = tags[filePath].name;
            return tag.includes(this.aditionalFilter);
        })
            .map((filePath) => {
            const stats = fs.statSync(filePath);
            const isFolder = stats.isDirectory();
            const tag = tags[filePath].name;
            const treeItem = new vscode.TreeItem(path.basename(filePath), vscode.TreeItemCollapsibleState.None);
            treeItem.command = {
                command: "taggy.openFile",
                title: "Open File",
                arguments: [filePath],
            };
            treeItem.iconPath = isFolder
                ? new vscode.ThemeIcon("folder")
                : new vscode.ThemeIcon("file");
            treeItem.tooltip = isFolder
                ? "This is a folder."
                : "This is a file. Click to open.";
            treeItem.description = `Tag: ${tag}`;
            treeItem.resourceUri = vscode.Uri.file(filePath);
            return treeItem;
        });
    }
    setFilter(filter) {
        this.aditionalFilter = filter;
        this.refresh();
    }
}
exports.TaggyTreeDataProvider = TaggyTreeDataProvider;
