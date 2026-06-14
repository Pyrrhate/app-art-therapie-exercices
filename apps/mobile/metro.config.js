const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

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
  react: path.resolve(mobileNodeModules, "react"),
  "react-dom": path.resolve(mobileNodeModules, "react-dom"),
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
