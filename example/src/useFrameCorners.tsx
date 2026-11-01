import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  CommonResolutions,
  type CameraFrameOutput,
  type Point,
  type Size,
  type PreviewView,
} from 'react-native-vision-camera';
import { useFrameOutput } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface FrameSize {
  width: number;
  height: number;
}

export interface FrameCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export function convertCornersToViewPoints(
  preview: PreviewView,
  corners: FrameCorners
): FrameCorners {
  return {
    topLeft: preview.convertCameraPointToViewPoint(corners.topLeft),
    topRight: preview.convertCameraPointToViewPoint(corners.topRight),
    bottomRight: preview.convertCameraPointToViewPoint(corners.bottomRight),
    bottomLeft: preview.convertCameraPointToViewPoint(corners.bottomLeft),
  };
}

interface UseFrameCornersResult {
  frameOutput: CameraFrameOutput;
  frameSize: FrameSize | undefined;
  cameraCorners: FrameCorners | undefined;
  /** Corner points in preview view coordinates, ready to be drawn. */
  viewCorners: FrameCorners | undefined;
  /** Pass the preview view once it is available (and after layout changes). */
  setPreview: (preview: PreviewView | undefined) => void;
  refresh: () => void;
}

/**
 * Shared by both preview screens: adds a frame output and exposes the
 * frame's corner points in camera coordinates and in preview view coordinates.
 */
export function useFrameCorners(
  targetResolution: Size = CommonResolutions.HD_16_9,
  // Change this value when the preview configuration changes (e.g. resolution).
  refreshKey?: unknown
): UseFrameCornersResult {
  const [frameSize, setFrameSize] = useState<FrameSize>();
  const [preview, setPreviewState] = useState<PreviewView>();
  const [cameraCorners, setCameraCorners] = useState<FrameCorners>();
  const [viewCorners, setViewCorners] = useState<FrameCorners>();

  const lastKey = useSharedValue('');
  const { width: targetWidth, height: targetHeight } = targetResolution;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const frameOutput = useFrameOutput({
    targetResolution,
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      const key = `${frame.width}x${frame.height}:${frame.orientation}`;
      if (lastKey.value !== key) {
        const size = { width: frame.width, height: frame.height };
        lastKey.value = key;
        // Camera coordinates are platform specific (normalized on iOS, sensor
        // pixels on Android), so let the Frame map its own corners.
        const { width, height } = frame;
        scheduleOnRN(setFrameSize, size);
        scheduleOnRN(setCameraCorners, {
          topLeft: frame.convertFramePointToCameraPoint({ x: 0, y: 0 }),
          topRight: frame.convertFramePointToCameraPoint({ x: width, y: 0 }),
          bottomRight: frame.convertFramePointToCameraPoint({
            x: width,
            y: height,
          }),
          bottomLeft: frame.convertFramePointToCameraPoint({ x: 0, y: height }),
        });
      }
      frame.dispose();
    },
  });

  const refresh = useCallback(() => {
    if (preview == null || cameraCorners == null) {
      return;
    }
    try {
      setViewCorners(convertCornersToViewPoints(preview, cameraCorners));
    } catch {
      // The preview view is not ready yet.
      setViewCorners(undefined);
    }
  }, [preview, cameraCorners]);

  useEffect(refresh, [refresh]);

  // A new frame resolution invalidates the corners until the next frame arrives.
  useEffect(() => {
    lastKey.value = '';
    setCameraCorners(undefined);
    setViewCorners(undefined);
  }, [targetWidth, targetHeight, lastKey]);

  // The native view matrix updates after the layout settles, so re-read it
  // once more after the window size or the preview configuration changes.
  useEffect(() => {
    const timeout = setTimeout(refresh, 300);
    return () => clearTimeout(timeout);
  }, [refresh, windowWidth, windowHeight, refreshKey]);

  return {
    frameOutput,
    frameSize,
    cameraCorners,
    viewCorners,
    setPreview: setPreviewState,
    refresh,
  };
}

function formatPoint(point: Point) {
  return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
}

export function FrameCornersInfo({
  frameSize,
  cameraCorners,
  viewCorners,
}: Pick<UseFrameCornersResult, 'frameSize' | 'cameraCorners' | 'viewCorners'>) {
  const dots = viewCorners ? Object.values(viewCorners) : [];

  return (
    <>
      {dots.map((point, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[
            styles.dot,
            { left: point.x - DOT_SIZE / 2, top: point.y - DOT_SIZE / 2 },
          ]}
        />
      ))}
      {/* <View pointerEvents="none" style={styles.container}>
        <Text style={styles.text}>
          Frame:{' '}
          {frameSize
            ? `${frameSize.width} × ${frameSize.height}`
            : 'waiting...'}
        </Text>
        <Text style={styles.text}>
          Camera:{' '}
          {cameraCorners
            ? `${formatPoint(cameraCorners.topLeft)} ${formatPoint(cameraCorners.bottomRight)}`
            : 'waiting...'}
        </Text>
        <Text style={styles.text}>
          View:{' '}
          {viewCorners
            ? `${formatPoint(viewCorners.topLeft)} ${formatPoint(viewCorners.bottomRight)}`
            : 'waiting...'}
        </Text>
      </View> */}
    </>
  );
}

const DOT_SIZE = 16;

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#ff3b30',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
    padding: 10,
  },
  text: {
    color: '#c5c7ce',
    fontSize: 12,
  },
});
