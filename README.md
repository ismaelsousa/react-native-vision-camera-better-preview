# react-native-vision-camera-better-preview

A Nitro Module workspace for building a custom native preview output for
[React Native VisionCamera](https://visioncamera.margelo.com/).

## Current status

The custom preview output is implemented on iOS and Android. The repository
provides:

- a Swift/Kotlin Nitro Module library scaffold;
- native dependencies on VisionCamera for iOS and Android;
- a native preview output backed by `AVCaptureVideoPreviewLayer` on iOS and
  CameraX `Preview` on Android;
- preview resolution and rotation updates through a JavaScript callback;
- a React Native 0.85 example app with camera permissions configured;
- a standard VisionCamera preview to verify the development environment;
- Nitrogen, TypeScript, ESLint, and library build scripts.

## Usage

Create the native output once and subscribe to configuration changes:

```tsx
import {
  createPreviewOutput,
  getUprightPreviewResolution,
} from 'react-native-vision-camera-better-preview';

const previewOutput = createPreviewOutput({
  onConfigurationChanged: (configuration) => {
    const resolution = getUprightPreviewResolution(configuration);

    console.log('Preview resolution:', resolution);
    console.log('Preview rotation:', configuration.rotationDegrees);
  },
});
```

`createPreviewOutput()` returns VisionCamera's `CameraOutput`. The callback
reports the native stream resolution and, when available, the rotation in
degrees. `getUprightPreviewResolution()` swaps width and height for quarter-turn
rotations so layout code can consume the displayed orientation directly.

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
