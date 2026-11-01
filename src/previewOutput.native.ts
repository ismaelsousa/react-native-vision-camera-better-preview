import { NitroModules } from 'react-native-nitro-modules';
import type { CameraOutput } from 'react-native-vision-camera';
import type { VisionCameraBetterPreviewFactory } from './VisionCameraBetterPreviewFactory.nitro';

const factory =
  NitroModules.createHybridObject<VisionCameraBetterPreviewFactory>(
    'VisionCameraBetterPreviewFactory'
  );

export function createPreviewOutput(): CameraOutput {
  return factory.createPreviewOutput();
}
