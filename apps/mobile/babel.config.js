module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        { jsxImportSource: "nativewind", reanimated: false },
      ],
      "nativewind/babel",
    ],
    // babel-preset-expo ne détecte pas expo-router depuis la racine du monorepo
    plugins: [
      require("babel-preset-expo/build/expo-router-plugin")
        .expoRouterBabelPlugin,
    ],
  };
};