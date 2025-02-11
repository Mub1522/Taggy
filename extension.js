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

  /* Command to add tags */
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
        `Tag "${tag}" with color "${tagColor.label}" added to "${path.basename(uri.fsPath)}".`
      );

      /* Listen to changes in the decorator */
      onDidChangeFileDecorationsEmitter.fire();
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

      onDidChangeFileDecorationsEmitter.fire();
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

module.exports = {
  activate,
  deactivate,
};
