const path = require("path");
const Module = require("module");
const { resolve } = require("metro-resolver");
const { createProxyMiddleware } = require("http-proxy-middleware");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");
const moduleSearchPaths = [mobileNodeModules, workspaceNodeModules];

/** NativeWind/css-interop charge react-native au chargement du config. */
const originalNodeModulePaths = Module._nodeModulePaths;
Module._nodeModulePaths = function (from) {
  const paths = originalNodeModulePaths.call(this, from);
  for (const dir of moduleSearchPaths) {
    if (!paths.includes(dir)) {
      paths.unshift(dir);
    }
  }
  return paths;
};

function packageRoot(name) {
  return path.dirname(
    require.resolve(`${name}/package.json`, { paths: moduleSearchPaths })
  );
}

const reactRoot = packageRoot("react");
const reactDomRoot = packageRoot("react-dom");
const reactNativeRoot = packageRoot("react-native");

require.resolve("react-native/package.json", { paths: moduleSearchPaths });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const apiProxyTarget = (
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://api.pastek-art.eu")
).replace(/\/$/, "");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = moduleSearchPaths;
config.resolver.extraNodeModules = {
  react: reactRoot,
  "react-dom": reactDomRoot,
  "react-native": reactNativeRoot,
  "react-native-web": packageRoot("react-native-web"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react") {
    return { type: "sourceFile", filePath: path.join(reactRoot, "index.js") };
  }
  if (moduleName === "react-dom") {
    return {
      type: "sourceFile",
      filePath: path.join(reactDomRoot, "index.js"),
    };
  }
  if (moduleName.startsWith("react/")) {
    return {
      type: "sourceFile",
      filePath: require.resolve(moduleName, { paths: [reactRoot] }),
    };
  }
  if (moduleName.startsWith("react-dom/")) {
    return {
      type: "sourceFile",
      filePath: require.resolve(moduleName, { paths: [reactDomRoot] }),
    };
  }
  return resolve(context, moduleName, platform);
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
