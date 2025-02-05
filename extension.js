const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

let tagsFilePath;

function activate(context) {
  console.log('Extension "taggy" is now active!');

  /* Crear el archivo tags.json si no existe en el global storage */
  tagsFilePath = path.join(context.globalStorageUri.fsPath, "tags.json");

  if (!fs.existsSync(context.globalStorageUri.fsPath)) {
    fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
  }
  if (!fs.existsSync(tagsFilePath)) {
    fs.writeFileSync(tagsFilePath, "{}", "utf8");
  }

  /* Comando para agregar tags */
  const addTagCommand = vscode.commands.registerCommand(
    "taggy.addTag",
    async (uri) => {
      vscode.window.showInformationMessage("Taggy: Add Tag to File! 🐧");

      if (!uri) {
        vscode.window.showErrorMessage("Select a file in the explorer.");
        return;
      }

      /* Solicitar la informacion del tag */
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
            label: "✔️ Success (Green)",
            value: "editorGutter.addedBackground",
          },
          { label: "❗ Error (Red)", value: "editorError.foreground" },
          { label: "⚠️ Warning (Yellow)", value: "editorWarning.foreground" },
          { label: "🔵 Info (Blue)", value: "editorInfo.foreground" },
          {
            label: "⚫ Ignored (Gray)",
            value: "gitDecoration.ignoredResourceForeground",
          },
          {
            label: "🟢 Untracked (Light Green)",
            value: "gitDecoration.untrackedResourceForeground",
          },
          {
            label: "🔴 Deleted (Dark Red)",
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
      /* Leer y guardar el nuevo tag */
      const tags = JSON.parse(fs.readFileSync(tagsFilePath, "utf8"));

      tags[uri.fsPath] = { name: tag, color: tagColor };
      fs.writeFileSync(tagsFilePath, JSON.stringify(tags, null, 2), "utf8");

      vscode.window.showInformationMessage(
        `Tag "${tag}" with color "${tagColor}" added to "${uri.fsPath}".`
      );

      /* Escuchar cambios en el decorador */
      onDidChangeFileDecorationsEmitter.fire();
    }
  );
  context.subscriptions.push(addTagCommand);

  /* Emisor de eventos */
  const onDidChangeFileDecorationsEmitter = new vscode.EventEmitter();

  /* Registrar el provider FileDecorationProvider */
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

  /* Uri: Identificador unico del archivo */
  provideFileDecoration(uri) {
    const tags = (() => {
      try {
        return JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));
      } catch (e) {
        console.error("Error reading tags.json:", e);
        return {};
      }
    })();

    /* Verificar si el archivo tiene un tag asignado */
    const tag = tags[uri.fsPath];
    if (tag) {
      return {
        badge: tag.name[0].toUpperCase(),
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
