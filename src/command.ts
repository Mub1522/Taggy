import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TaggyTreeDataProvider } from "./treeView";
import { writeTags, readTags } from "./storage";

export function registerAddTagCommand(
  context: vscode.ExtensionContext,
  tagsFilePath: string,
  onDidChangeFileDecorationsEmitter: vscode.EventEmitter<void>,
  treeDataProvider: TaggyTreeDataProvider
) {
  const addTagCommand = vscode.commands.registerCommand(
    "taggy.addTag",
    async (uri: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage("Select a file in the explorer.");
        return;
      }

      /* Request tag information */
      const tag = await vscode.window.showInputBox({
        prompt: "Write a tag for this file:",
        placeHolder: "For example: Important, Review, etc.",
      });

      if (!tag) {
        vscode.window.showErrorMessage("No tag has been provided.");
        return;
      }

      const tagColor = await vscode.window.showQuickPick(
        [
          { label: "Green 🍀", value: "editorGutter.addedBackground" },
          { label: "Red 💗", value: "editorError.foreground" },
          { label: "Yellow 🍌", value: "editorWarning.foreground" },
          { label: "Blue 🔵", value: "editorInfo.foreground" },
          {
            label: "Gray ⚫",
            value: "gitDecoration.ignoredResourceForeground",
          },
          {
            label: "Light Green 🍐",
            value: "gitDecoration.untrackedResourceForeground",
          },
          {
            label: "Dark Red 🍒",
            value: "editorGutter.deletedBackground",
          },
        ],
        {
          placeHolder: "Select a tag color (theme colors)",
        }
      );

      if (!tagColor) {
        vscode.window.showErrorMessage("No color has been selected.");
        return;
      }

      /* Read and save the new tag */
      const tags = readTags(tagsFilePath);

      tags[uri.fsPath] = { name: tag, color: tagColor };

      writeTags(tagsFilePath, tags);

      vscode.window.showInformationMessage(
        `Tag "${tag}" with color "${tagColor.label}" added to "${path.basename(
          uri.fsPath
        )}".`
      );

      /* Notify changes */
      onDidChangeFileDecorationsEmitter.fire();
      treeDataProvider.refresh();
    }
  );

  context.subscriptions.push(addTagCommand);
}

export function registerRemoveTagCommand(
  context: vscode.ExtensionContext,
  tagsFilePath: string,
  onDidChangeFileDecorationsEmitter: vscode.EventEmitter<void>,
  treeDataProvider: TaggyTreeDataProvider
) {
  const removeTagCommand = vscode.commands.registerCommand(
    "taggy.removeTag",
    async (uri) => {
      if (!uri) {
        vscode.window.showErrorMessage("Select a file in the explorer.");
        return;
      }

      const tags = JSON.parse(fs.readFileSync(tagsFilePath, "utf8"));

      if (!tags[uri.fsPath]) {
        vscode.window.showErrorMessage("This file does not have a tag.");
        return;
      }

      delete tags[uri.fsPath];

      fs.writeFileSync(tagsFilePath, JSON.stringify(tags, null, 2), "utf8");

      vscode.window.showInformationMessage(
        `Tag removed from "${path.basename(uri.fsPath)}".`
      );

      /* Notify changes */
      onDidChangeFileDecorationsEmitter.fire();
      treeDataProvider.refresh();
    }
  );
  context.subscriptions.push(removeTagCommand);
}

export function registerOpenFileCommand(context: vscode.ExtensionContext) {
  const openFileCommand = vscode.commands.registerCommand(
    "taggy.openFile",
    async (filePath: string) => {
      try {
        const stats: fs.Stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          vscode.window.showWarningMessage(
            "Cannot open a folder directly. Please select a file."
          );
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const imageExtensions = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".bmp",
          ".svg",
          ".webp",
        ];

        if (imageExtensions.includes(ext)) {
          vscode.window.showWarningMessage(
            "This is an image. Cannot open it as text."
          );
          return;
        }

        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
      } catch (err: unknown) {
        vscode.window.showErrorMessage(
          "Error checking file: " +
            (err instanceof Error ? err.message : String(err))
        );
      }
    }
  );

  context.subscriptions.push(openFileCommand);
}
