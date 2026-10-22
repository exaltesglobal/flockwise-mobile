// The shared engine in src/core is copied verbatim from flockwise-api, which uses Node-style
// ESM imports ("./db.js" for db.ts). Teach Metro to resolve those to the .ts source.
const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

const config = getDefaultConfig(__dirname);
const coreDir = path.join(__dirname, 'src', 'core') + path.sep;
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream ?? context.resolveRequest;
  if (context.originModulePath.startsWith(coreDir) && moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    try {
      return resolve(context, moduleName.slice(0, -3), platform);
    } catch {
      /* fall back to the literal .js path */
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
