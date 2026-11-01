import { NitroModules } from 'react-native-nitro-modules';
import type { VisionCameraBetterPreview } from './VisionCameraBetterPreview.nitro';

const VisionCameraBetterPreviewHybridObject =
  NitroModules.createHybridObject<VisionCameraBetterPreview>('VisionCameraBetterPreview');

export function multiply(a: number, b: number): number {
  return VisionCameraBetterPreviewHybridObject.multiply(a, b);
}
