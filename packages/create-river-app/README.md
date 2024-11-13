# Create River App

This package is used to scaffold a new React River app.

It will run `create-vite` to scaffold the project using `react-ts` template.

Then, it will install the necessary dependencies: `@river-build/sdk` and `@river-build/sdk-react`.

Finally, it will add the `vite-plugin-node-polyfills` to the `vite.config.ts` file to ensure compatibility with Node.js native modules that are used by the River SDK.

## Usage

You can use your preferred package manager to run the command.
Example using `yarn`:

```bash
yarn create river-app
```
