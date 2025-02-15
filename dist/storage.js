"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTagsFile = initializeTagsFile;
exports.readTags = readTags;
exports.writeTags = writeTags;
const fs = require("fs");
const path = require("path");
/**
 * Ensures that the tags.json file exists, creates it if not.
 * @param context - VS Code extension context.
 * @returns The path to the tags.json file.
 */
function initializeTagsFile(context) {
    const storagePath = context.globalStorageUri.fsPath;
    const tagsFilePath = path.join(storagePath, "tags.json");
    try {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        if (!fs.existsSync(tagsFilePath)) {
            writeTags(tagsFilePath, {});
        }
    }
    catch (error) {
        console.error("Error initializing tags.json:", error);
    }
    return tagsFilePath;
}
/**
 * Reads and parses the tags.json file.
 * @param filePath - Path to the tags.json file.
 * @returns Parsed tags object.
 */
function readTags(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return {};
        }
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    catch (error) {
        console.error("Error reading tags.json:", error);
        return {};
    }
}
/**
 * Writes tags data to the tags.json file.
 * @param filePath - Path to the tags.json file.
 * @param data - Tags data to write.
 */
function writeTags(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    }
    catch (error) {
        console.error("Error writing to tags.json:", error);
    }
}
