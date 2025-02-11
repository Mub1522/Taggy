const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

let tagsFilePath;

function activate(context) {
  console.log('Extension "taggy" is now active!');

  /* Create tags.json file if it does not exist in global storage */
  tagsFilePath = path.join(context.globalStorageUri.fsPath, "tags.json");
  if (!fs.existsSync(context.globalStorageUri.fsPath)) {
    fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
  }
  if (!fs.existsSync(tagsFilePath)) {
    fs.writeFileSync(tagsFilePath, "{}", "utf8");
  }

  /* TreeView */
  const treeDataProvider = new TaggyTreeDataProvider(tagsFilePath);
  const treeView = vscode.window.createTreeView("taggySidebar", {
    treeDataProvider,
  });
  context.subscriptions.push(treeView, treeDataProvider);

  /* Command to add tags */
  vscode.commands.registerCommand("taggy.openFile", (filePath) => {
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        vscode.window.showWarningMessage(
          "Cannot open a folder directly. Please select a file."
        );
        return;
      }

      vscode.workspace
        .openTextDocument(filePath)
        .then((document) => vscode.window.showTextDocument(document))
        // @ts-ignore
        .catch((err) =>
          vscode.window.showErrorMessage("Could not open file: " + err)
        );
    } catch (err) {
      vscode.window.showErrorMessage("Error checking file: " + err.message);
    }
  });

  const addTagCommand = vscode.commands.registerCommand(
    "taggy.addTag",
    async (uri) => {
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
          {
            label: "Green 🍀",
            value: "editorGutter.addedBackground",
          },
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
      const tags = JSON.parse(fs.readFileSync(tagsFilePath, "utf8"));

      tags[uri.fsPath] = { name: tag, color: tagColor };
      fs.writeFileSync(tagsFilePath, JSON.stringify(tags, null, 2), "utf8");

      vscode.window.showInformationMessage(
        `Tag "${tag}" with color "${tagColor.label}" added to "${path.basename(
          uri.fsPath
        )}".`
      );

      /* Listen to changes in the decorator */
      onDidChangeFileDecorationsEmitter.fire();
      /* Refresh TreeView */
      treeDataProvider.refresh();
    }
  );
  context.subscriptions.push(addTagCommand);

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

      /* Listen to changes in the decorator */
      onDidChangeFileDecorationsEmitter.fire();
      /* Refresh TreeView */
      treeDataProvider.refresh();
    }
  );
  context.subscriptions.push(removeTagCommand);

  /* Event emitter */
  const onDidChangeFileDecorationsEmitter = new vscode.EventEmitter();

  /* Register the FileDecorationProvider provider */
  const decorator = new FileDecorator(tagsFilePath);
  // @ts-ignore
  decorator.onDidChangeFileDecorations =
    onDidChangeFileDecorationsEmitter.event;
  const provider = vscode.window.registerFileDecorationProvider(decorator);

  context.subscriptions.push(provider);
}

function deactivate() {}

class FileDecorator {
  constructor(tagsFilePath) {
    this.tagsFilePath = tagsFilePath;
  }

  /* Uri: Unique identifier of the file */
  provideFileDecoration(uri) {
    const tags = (() => {
      try {
        return JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));
      } catch (e) {
        console.error("Error reading tags.json:", e);
        return {};
      }
    })();

    /* Check if the file has a tag assigned */
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

class TaggyTreeDataProvider {
  constructor(tagsFilePath) {
    this.tagsFilePath = tagsFilePath;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  getTreeItem(element) {
    return element;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getChildren() {
    const tags = JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));

    return Object.keys(tags).map((filePath) => {
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

module.exports = {
  activate,
  deactivate,
};
