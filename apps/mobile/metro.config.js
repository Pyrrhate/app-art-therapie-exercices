const fs = require("fs");
const path = require("path");
const Module = require("module");
const { resolve } = require("metro-resolver");
const { createProxyMiddleware } = require("http-proxy-middleware");

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, "public");
const workspaceRoot = path.resolve(projectRoot, "../..");
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");
const moduleSearchPaths = [mobileNodeModules, workspaceNodeModules];

/** Charge .env pour le proxy Metro (Expo ne les injecte pas toujours ici). */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(projectRoot, ".env.local"));

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

function normalizeApiProxyTarget(url) {
  const trimmed = url.replace(/\/$/, "");
  if (/^https?:\/\/(www\.)?pastek-art\.eu$/i.test(trimmed)) {
    return "https://api.pastek-art.eu";
  }
  return trimmed;
}

const PRODUCTION_API = "https://api.pastek-art.eu";

const apiProxyTarget = normalizeApiProxyTarget(
  process.env.EXPO_PUBLIC_API_URL?.trim() || PRODUCTION_API
);

console.log(`[metro] API proxy → ${apiProxyTarget}`);

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
  secure: true,
  on: {
    error(err, _req, res) {
      console.error("[metro] API proxy error:", err.message);
      if (res && !res.headersSent && typeof res.writeHead === "function") {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error:
              "Proxy API indisponible. Vérifiez EXPO_PUBLIC_API_URL et le déploiement.",
            code: "PROXY_ERROR",
            target: apiProxyTarget,
          })
        );
      }
    },
  },
});

function tryServePublicFile(req, res) {
  const pathname = req.url?.split("?")[0];
  if (!pathname || pathname.includes("..")) return false;

  const relative = pathname.replace(/^\//, "");
  if (!relative) return false;

  const filePath = path.join(publicDir, relative);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) {
    return false;
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return false;

  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".xml": "text/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".ico": "image/x-icon",
  };

  res.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
  res.end(fs.readFileSync(filePath));
  return true;
}

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url?.startsWith("/api/")) {
        return apiProxy(req, res, next);
      }
      if (tryServePublicFile(req, res)) {
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
