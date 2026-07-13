const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some managed Windows environments cannot spawn Metro's child processes.
// A single worker runs transforms in-process and behaves the same on devices/web.
config.maxWorkers = 1;

module.exports = config;
