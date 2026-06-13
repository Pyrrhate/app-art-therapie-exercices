const path = require("path");
const Module = require("module");
const { createProxyMiddleware } = require("http-proxy-middleware");

const projectRoot = __dirname;
const mobileNodeModules = path.resolve(projectRoot, "node_modules");

const originalNodeModulePaths = Module._nodeModulePaths;
Module._nodeModulePaths = function (from) {
  const paths = originalNodeModulePaths.call(this, from);
  if (!paths.includes(mobileNodeModules)) {
    paths.unshift(mobileNodeModules);
  }
  return paths;
};

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const apiProxyTarget = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://pastek-art.eu"
).replace(/\/$/, "");

const config = getDefaultConfig(projectRoot);

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
