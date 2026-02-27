# Figma Plugin React Template

![62862431-71537f00-bd0e-11e9-85db-d97c0fb729a4](https://user-images.githubusercontent.com/16322616/62862692-46b5f600-bd0f-11e9-93b0-75955d1de8f3.png)

This template contains the react example as shown on [Figma Docs](https://www.figma.com/plugin-docs/intro/), with some structural changes and extra tooling.

## Quickstart

- Run `yarn` to install dependencies.
- Run `yarn build:watch` to start webpack in watch mode.
- Open `Figma` -> `Plugins` -> `Development` -> `Import plugin from manifest...` and choose `manifest.json` file from this repo.

⭐ To change the UI of your plugin (the react code), start editing [App.tsx](./src/app/components/App.tsx).  
⭐ To interact with the Figma API edit [controller.ts](./src/plugin/controller.ts).  
⭐ Read more on the [Figma API Overview](https://www.figma.com/plugin-docs/api/api-overview/).

Note: this plugin currently runs through command parameters in `controller.ts`; the React UI bundle is kept as template code and is not invoked at runtime.

## Toolings

This repo is using:

- React + Webpack
- TypeScript
- Prettier precommit hook

## Command Notes

- `sc` uses a scale factor, not percent.
- Examples: `sc2` scales to `2x`, `sc0.5` scales to `0.5x`.
