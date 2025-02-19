import * as vscode from "vscode";
const { initializeTagsFile } = require("../dist/storage");
const { registerOpenFileCommand } = require("../dist/command");
const { registerAddTagCommand } = require("../dist/command");
const { registerRemoveTagCommand } = require("../dist/command");
const { TaggyTreeDataProvider } = require("../dist/treeView");
const { FileDecorator } = require("../dist/fileDecorator");
const { registerFilterTagsCommand } = require("../dist/command");

let tagsFilePath;

function activate(context: vscode.ExtensionContext) {
  console.log('Extension "taggy" is now active!');

  tagsFilePath = initializeTagsFile(context);

  /* TreeView */
  const treeDataProvider = new TaggyTreeDataProvider(tagsFilePath);
  const treeView = vscode.window.createTreeView("taggySidebar", {
    treeDataProvider,
  });
  context.subscriptions.push(treeView);

  /* Register the FileDecorationProvider provider */
  const onDidChangeFileDecorationsEmitter = new vscode.EventEmitter();
  const decorator = new FileDecorator(tagsFilePath);
  decorator.onDidChangeFileDecorations =
    onDidChangeFileDecorationsEmitter.event;

  const provider = vscode.window.registerFileDecorationProvider(decorator);
  context.subscriptions.push(provider);

  /* Commands */
  registerOpenFileCommand(context);

  registerAddTagCommand(
    context,
    tagsFilePath,
    onDidChangeFileDecorationsEmitter,
    treeDataProvider
  );
  registerRemoveTagCommand(
    context,
    tagsFilePath,
    onDidChangeFileDecorationsEmitter,
    treeDataProvider
  );
  registerFilterTagsCommand(
    context, 
    treeDataProvider
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
