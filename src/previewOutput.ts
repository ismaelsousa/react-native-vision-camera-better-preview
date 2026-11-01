import type { CameraOutput } from 'react-native-vision-camera';

export function createPreviewOutput(): CameraOutput {
  throw new Error(
    "'react-native-vision-camera-better-preview' is only supported on native platforms."
  );
}
