import { NitroModules } from 'react-native-nitro-modules';
import type { CameraPreviewOutput } from 'react-native-vision-camera';
import type {
  BetterPreviewOutputOptions,
  VisionCameraBetterPreviewFactory,
} from './VisionCameraBetterPreviewFactory.nitro';

const factory =
  NitroModules.createHybridObject<VisionCameraBetterPreviewFactory>(
    'VisionCameraBetterPreviewFactory'
  );

export function createPreviewOutput(
  options: BetterPreviewOutputOptions = {}
): CameraPreviewOutput {
  return factory.createPreviewOutput(options) as CameraPreviewOutput;
}
