/* global __dirname */
const path = require("path");

module.exports = function configureBabel(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@shared": path.resolve(__dirname, "../../src"),
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
    ],
  };
};
