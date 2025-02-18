"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAddTagCommand = registerAddTagCommand;
exports.registerRemoveTagCommand = registerRemoveTagCommand;
exports.registerOpenFileCommand = registerOpenFileCommand;
exports.registerFilterTagsCommand = registerFilterTagsCommand;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const storage_1 = require("./storage");
function registerAddTagCommand(context, tagsFilePath, onDidChangeFileDecorationsEmitter, treeDataProvider) {
    const addTagCommand = vscode.commands.registerCommand("taggy.addTag", (uri) => __awaiter(this, void 0, void 0, function* () {
        if (!uri) {
            vscode.window.showErrorMessage("Select a file in the explorer.");
            return;
        }
        /* Request tag information */
        const tag = yield vscode.window.showInputBox({
            prompt: "Write a tag for this file:",
            placeHolder: "For example: Important, Review, etc.",
        });
        if (!tag) {
            vscode.window.showErrorMessage("No tag has been provided.");
            return;
        }
        const tagColor = yield vscode.window.showQuickPick([
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
        ], {
            placeHolder: "Select a tag color (theme colors)",
        });
        if (!tagColor) {
            vscode.window.showErrorMessage("No color has been selected.");
            return;
        }
        /* Read and save the new tag */
        const tags = (0, storage_1.readTags)(tagsFilePath);
        tags[uri.fsPath] = { name: tag, color: tagColor };
        (0, storage_1.writeTags)(tagsFilePath, tags);
        vscode.window.showInformationMessage(`Tag "${tag}" with color "${tagColor.label}" added to "${path.basename(uri.fsPath)}".`);
        /* Notify changes */
        onDidChangeFileDecorationsEmitter.fire();
        treeDataProvider.refresh();
    }));
    context.subscriptions.push(addTagCommand);
}
function registerRemoveTagCommand(context, tagsFilePath, onDidChangeFileDecorationsEmitter, treeDataProvider) {
    const removeTagCommand = vscode.commands.registerCommand("taggy.removeTag", (uri) => __awaiter(this, void 0, void 0, function* () {
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
        vscode.window.showInformationMessage(`Tag removed from "${path.basename(uri.fsPath)}".`);
        /* Notify changes */
        onDidChangeFileDecorationsEmitter.fire();
        treeDataProvider.refresh();
    }));
    context.subscriptions.push(removeTagCommand);
}
function registerOpenFileCommand(context) {
    const openFileCommand = vscode.commands.registerCommand("taggy.openFile", (filePath) => __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                vscode.window.showWarningMessage("Cannot open a folder directly. Please select a file.");
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
                vscode.window.showWarningMessage("This is an image. Cannot open it as text.");
                return;
            }
            const document = yield vscode.workspace.openTextDocument(filePath);
            yield vscode.window.showTextDocument(document);
        }
        catch (err) {
            vscode.window.showErrorMessage("Error checking file: " +
                (err instanceof Error ? err.message : String(err)));
        }
    }));
    context.subscriptions.push(openFileCommand);
}
function registerFilterTagsCommand(context, treeDataProvider) {
    const filterTagsCommand = vscode.commands.registerCommand("taggySidebar.filter", () => __awaiter(this, void 0, void 0, function* () {
        const inputBox = vscode.window.createInputBox();
        let filterApplied = false;
        inputBox.title = "Filter tags by name";
        inputBox.placeholder = "For example: Important, Review, etc.";
        inputBox.ignoreFocusOut = true;
        inputBox.onDidChangeValue((value) => {
            console.log(value);
            treeDataProvider.setFilter(value);
        });
        inputBox.onDidAccept(() => {
            filterApplied = true;
            inputBox.hide();
        });
        inputBox.onDidHide(() => {
            if (!filterApplied) {
                treeDataProvider.setFilter("");
            }
            inputBox.dispose();
        });
        inputBox.show();
    }));
    context.subscriptions.push(filterTagsCommand);
}
