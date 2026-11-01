import type { HybridObject } from 'react-native-nitro-modules';
import type { CameraOutput } from 'react-native-vision-camera';

export interface VisionCameraBetterPreviewFactory extends HybridObject<{
  ios: 'swift';
  android: 'kotlin';
}> {
  /** Creates a custom preview output that can be attached to VisionCamera. */
  createPreviewOutput(): CameraOutput;
}
