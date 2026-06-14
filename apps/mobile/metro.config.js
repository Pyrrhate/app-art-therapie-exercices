const path = require("path");
const Module = require("module");
const { createProxyMiddleware } = require("http-proxy-middleware");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

/** NativeWind/css-interop résout react-native au chargement — avant tout require nativewind. */
const originalNodeModulePaths = Module._nodeModulePaths;
Module._nodeModulePaths = function (from) {
  const paths = originalNodeModulePaths.call(this, from);
  for (const dir of [mobileNodeModules, workspaceNodeModules]) {
    if (!paths.includes(dir)) {
      paths.unshift(dir);
    }
  }
  return paths;
};

require.resolve("react-native/package.json", {
  paths: [mobileNodeModules, workspaceNodeModules],
});

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const apiProxyTarget = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.pastek-art.eu"
).replace(/\/$/, "");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  workspaceNodeModules,
];
config.resolver.extraNodeModules = {
  react: path.join(mobileNodeModules, "react"),
  "react-dom": path.join(mobileNodeModules, "react-dom"),
  "react-native": path.join(mobileNodeModules, "react-native"),
};

const apiProxy = createProxyMiddleware({
  target: apiProxyTarget,
  changeOrigin: true,
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url?.startsWith("/api/")) {
        return apiProxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
