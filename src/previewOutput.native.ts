import { NitroModules } from 'react-native-nitro-modules';
import type { CameraOutput } from 'react-native-vision-camera';
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
): CameraOutput {
  return factory.createPreviewOutput(options);
}
