import * as vscode from "vscode";
import * as fs from "fs";

export class FileDecorator implements vscode.FileDecorationProvider {
  private tagsFilePath: string;

  constructor(tagsFilePath: string) {
    this.tagsFilePath = tagsFilePath;
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    const tags = (() => {
      try {
        return JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));
      } catch (e) {
        console.error("Error reading tags.json:", e);
        return {};
      }
    })();

    const tag = tags[uri.fsPath];
    if (tag) {
      return {
        badge: tag.name.substring(0, 2).toUpperCase(),
        tooltip: `Tag: ${tag.name}`,
        color: new vscode.ThemeColor(tag.color.value),
      };
    }
  }
}
