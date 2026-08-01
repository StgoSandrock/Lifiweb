const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../..")];
if (!config.resolver.assetExts.includes("avif")) config.resolver.assetExts.push("avif");

module.exports = config;
