/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
  ...require("@river-build/prettier-config"),
  plugins: ["prettier-plugin-tailwindcss"],
};
