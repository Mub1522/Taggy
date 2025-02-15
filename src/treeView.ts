import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class TaggyTreeDataProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  constructor(private tagsFilePath: string) {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getChildren(): vscode.TreeItem[] {
    const tags = JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));
    console.log(tags);

    return Object.keys(tags)
      .filter((filePath) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return false;

        const rootPath = workspaceFolders[0].uri.fsPath;
        return filePath.startsWith(rootPath);
      })
      .map((filePath) => {
        const stats = fs.statSync(filePath);
        const isFolder = stats.isDirectory();
        const tag = tags[filePath].name;

        const treeItem = new vscode.TreeItem(
          path.basename(filePath),
          vscode.TreeItemCollapsibleState.None
        );

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
}
