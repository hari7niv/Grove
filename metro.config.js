const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Make sure Metro resolves .wasm and worker files correctly
config.resolver.assetExts.push('wasm');

module.exports = config;
