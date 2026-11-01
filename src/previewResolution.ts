import type { Size } from 'react-native-vision-camera';
import type { BetterPreviewConfiguration } from './VisionCameraBetterPreviewFactory.nitro';

/**
 * Returns the preview resolution after applying its display rotation.
 *
 * Returns `undefined` if the configuration or rotation is unavailable. On
 * iOS, rotation is available only on iOS 17.0 and later.
 */
export function getUprightPreviewResolution(
  configuration: BetterPreviewConfiguration | undefined
): Size | undefined {
  if (configuration?.rotationDegrees == null) return undefined;

  const { width, height } = configuration.resolution;
  if (width <= 0 || height <= 0) return undefined;

  const swapsDimensions =
    configuration.rotationDegrees === 90 ||
    configuration.rotationDegrees === 270;

  return swapsDimensions ? { width: height, height: width } : { width, height };
}

/**
 * Returns the aspect ratio of the upright preview stream, or `undefined` when
 * the upright resolution cannot be determined.
 */
export function getUprightPreviewAspectRatio(
  configuration: BetterPreviewConfiguration | undefined
): number | undefined {
  const resolution = getUprightPreviewResolution(configuration);
  if (resolution == null) return undefined;
  return resolution.width / resolution.height;
}
