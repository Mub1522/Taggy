"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDecorator = void 0;
const vscode = require("vscode");
const fs = require("fs");
class FileDecorator {
    constructor(tagsFilePath) {
        this.tagsFilePath = tagsFilePath;
    }
    provideFileDecoration(uri) {
        const tags = (() => {
            try {
                return JSON.parse(fs.readFileSync(this.tagsFilePath, "utf8"));
            }
            catch (e) {
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
exports.FileDecorator = FileDecorator;
