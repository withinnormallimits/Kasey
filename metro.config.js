/**
 * Metro config.
 *
 * expo-sqlite runs on web through a WebAssembly build of SQLite, which needs
 * two things Metro does not do by default:
 *
 * 1. `.wasm` treated as an asset, or the worker import fails to resolve.
 * 2. Cross origin isolation headers. The web build stores the database in
 *    OPFS, which requires SharedArrayBuffer, which browsers only expose to
 *    cross origin isolated pages.
 *
 * None of this affects iOS or Android, which use the native SQLite library.
 * It exists so the app can be developed and looked at in a desktop browser.
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    return middleware(req, res, next);
  },
};

module.exports = config;
