import type { CameraOutput } from 'react-native-vision-camera';
import type { BetterPreviewOutputOptions } from './VisionCameraBetterPreviewFactory.nitro';

export function createPreviewOutput(
  _options: BetterPreviewOutputOptions = {}
): CameraOutput {
  throw new Error(
    "'react-native-vision-camera-better-preview' is only supported on native platforms."
  );
}
