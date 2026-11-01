# react-native-vision-camera-better-preview

A Nitro Module workspace for building a custom native preview output for
[React Native VisionCamera](https://visioncamera.margelo.com/).

## Current status

The development environment is ready, but the custom preview output is not
implemented yet. The repository currently provides:

- a Swift/Kotlin Nitro Module library scaffold;
- native dependencies on VisionCamera for iOS and Android;
- a React Native 0.85 example app with camera permissions configured;
- a standard VisionCamera preview to verify the development environment;
- Nitrogen, TypeScript, ESLint, and library build scripts.

The output factory is defined in
`src/VisionCameraBetterPreviewFactory.nitro.ts`. Its `createPreviewOutput()`
method already exposes the intended `CameraOutput` return type, while the native
method currently throws an explicit not-implemented error. The next step is to
add the native preview output implementations and return them from the factory.

## Development setup

Install all workspace dependencies:

```sh
yarn
```

Generate Nitro bindings after changing any `*.nitro.ts` file:

```sh
yarn nitrogen
```

Install iOS pods:

```sh
yarn example pod-install
```

Run the example app:

```sh
yarn example ios
yarn example android
```

Run project checks:

```sh
yarn typecheck
yarn lint
yarn prepare
```

## Architecture references

- [VisionCamera custom native CameraOutputs](https://visioncamera.margelo.com/docs/custom-native-camera-outputs)
- [How to build a Nitro Module](https://nitro.margelo.com/docs/getting-started/how-to-build-a-nitro-module)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob).
