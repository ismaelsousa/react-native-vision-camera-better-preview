import type { HybridObject } from 'react-native-nitro-modules';
import type { CameraOutput, Size } from 'react-native-vision-camera';

/** The preview stream configuration in its native, unrotated orientation. */
export interface BetterPreviewConfiguration {
  readonly resolution: Size;
  /** Clockwise rotation required to display the stream upright. */
  readonly rotationDegrees?: number;
}

export interface BetterPreviewOutputOptions {
  /**
   * The preferred preview resolution. The camera session negotiates this with
   * the other outputs, so the resulting resolution may differ.
   *
   * When omitted, the platform's default preview resolution preference is used.
   */
  targetResolution?: Size;
  /** Called whenever the native preview resolution or rotation changes. */
  onConfigurationChanged?: (configuration: BetterPreviewConfiguration) => void;
}

export interface VisionCameraBetterPreviewFactory extends HybridObject<{
  ios: 'swift';
  android: 'kotlin';
}> {
  /** Creates a custom preview output that can be attached to VisionCamera. */
  createPreviewOutput(options: BetterPreviewOutputOptions): CameraOutput;
}
