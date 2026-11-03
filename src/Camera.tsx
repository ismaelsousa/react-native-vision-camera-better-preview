import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { callback } from 'react-native-nitro-modules';
import {
  NativePreviewView,
  VisionCamera,
  useCamera,
  type CameraRef as VisionCameraCameraRef,
  type CameraViewProps as VisionCameraCameraViewProps,
  type GestureController,
  type PreviewView,
  type Size,
} from 'react-native-vision-camera';

import type { BetterPreviewConfiguration } from './VisionCameraBetterPreviewFactory.nitro';
import { createPreviewOutput } from './previewOutput';
import { getUprightPreviewResolution } from './previewResolution';

export type CameraRef = VisionCameraCameraRef;

/**
 * Props for the Better Preview Camera component.
 *
 * This is compatible with VisionCamera's Camera component and adds control
 * over the native preview output's preferred resolution and configuration.
 */
export interface CameraViewProps extends VisionCameraCameraViewProps {
  /** Called whenever the native preview resolution or rotation changes. */
  onPreviewConfigurationChanged?: (
    configuration: BetterPreviewConfiguration
  ) => void;
  /**
   * Called when the preview's upright stream resolution becomes available or
   * changes. On iOS this requires iOS 17 or newer.
   */
  onPreviewResolution?: (resolution: Size) => void;
  /**
   * The preferred preview resolution. It is negotiated with the other camera
   * outputs, so the resulting resolution may differ.
   */
  previewTargetResolution?: Size;
}

function useGestureControllers(
  controller: CameraRef['controller'],
  enableNativeTapToFocusGesture: boolean,
  enableNativeZoomGesture: boolean
): GestureController[] {
  const gestureControllers = useMemo<GestureController[]>(() => {
    const result: GestureController[] = [];
    if (enableNativeTapToFocusGesture) {
      result.push(VisionCamera.createTapToFocusGestureController());
    }
    if (enableNativeZoomGesture) {
      result.push(VisionCamera.createZoomGestureController());
    }
    return result;
  }, [enableNativeTapToFocusGesture, enableNativeZoomGesture]);

  useEffect(() => {
    for (const gestureController of gestureControllers) {
      gestureController.controller = controller;
    }
  }, [controller, gestureControllers]);

  return gestureControllers;
}

function CameraImpl({
  implementationMode,
  resizeMode,
  onPreviewStarted,
  onPreviewStopped,
  onPreviewConfigurationChanged,
  onPreviewResolution,
  previewTargetResolution,
  outputs = [],
  enableNativeZoomGesture = false,
  enableNativeTapToFocusGesture = false,
  ref,
  ...props
}: CameraViewProps): React.ReactElement {
  const configurationCallbacksRef = useRef({
    onPreviewConfigurationChanged,
    onPreviewResolution,
  });
  configurationCallbacksRef.current = {
    onPreviewConfigurationChanged,
    onPreviewResolution,
  };

  const targetWidth = previewTargetResolution?.width;
  const targetHeight = previewTargetResolution?.height;
  const previewOutput = useMemo(
    () =>
      createPreviewOutput({
        targetResolution:
          targetWidth == null || targetHeight == null
            ? undefined
            : { width: targetWidth, height: targetHeight },
        onConfigurationChanged(configuration) {
          const callbacks = configurationCallbacksRef.current;
          callbacks.onPreviewConfigurationChanged?.(configuration);

          const resolution = getUprightPreviewResolution(configuration);
          if (resolution != null) {
            callbacks.onPreviewResolution?.(resolution);
          }
        },
      }),
    [targetHeight, targetWidth]
  );

  const controller = useCamera({
    ...props,
    outputs: [previewOutput, ...outputs],
  });

  const previewViewRef = useRef<PreviewView>(null);
  const setHybridRef = useMemo(
    () =>
      callback((preview: PreviewView) => {
        previewViewRef.current = preview;
      }),
    []
  );

  useImperativeHandle(
    // The example workspace can resolve VisionCamera's React types from a
    // nested dependency. Bridge that duplicate type identity internally while
    // keeping the public ref prop inherited directly from VisionCamera.
    ref as unknown as React.Ref<CameraRef>,
    () => ({
      startZoomAnimation(zoom, rate) {
        if (controller == null) throw new Error('Camera is not yet ready!');
        return controller.startZoomAnimation(zoom, rate);
      },
      cancelZoomAnimation() {
        if (controller == null) throw new Error('Camera is not yet ready!');
        return controller.cancelZoomAnimation();
      },
      async focusTo(viewPoint, options = {}) {
        if (controller == null) throw new Error('Camera is not yet ready!');
        if (previewViewRef.current == null) {
          throw new Error('Camera Preview is not yet ready!');
        }
        const meteringPoint = previewViewRef.current.createMeteringPoint(
          viewPoint.x,
          viewPoint.y
        );
        await controller.focusTo(meteringPoint, options);
      },
      async resetFocus() {
        if (controller == null) throw new Error('Camera is not yet ready!');
        await controller.resetFocus();
      },
      createMeteringPoint(x, y, size) {
        if (previewViewRef.current == null) {
          throw new Error('Camera Preview is not yet ready!');
        }
        return previewViewRef.current.createMeteringPoint(x, y, size);
      },
      takeSnapshot() {
        if (previewViewRef.current == null) {
          throw new Error('Camera Preview is not yet ready!');
        }
        return previewViewRef.current.takeSnapshot();
      },
      convertCameraPointToViewPoint(cameraPoint) {
        if (previewViewRef.current == null) {
          throw new Error('Camera Preview is not yet ready!');
        }
        return previewViewRef.current.convertCameraPointToViewPoint(
          cameraPoint
        );
      },
      convertViewPointToCameraPoint(viewPoint) {
        if (previewViewRef.current == null) {
          throw new Error('Camera Preview is not yet ready!');
        }
        return previewViewRef.current.convertViewPointToCameraPoint(viewPoint);
      },
      convertScannedObjectCoordinatesToViewCoordinates(scannedObject) {
        if (previewViewRef.current == null) {
          throw new Error('Camera Preview is not yet ready!');
        }
        return previewViewRef.current.convertScannedObjectCoordinatesToViewCoordinates(
          scannedObject
        );
      },
      get controller() {
        return controller;
      },
      get preview() {
        return previewViewRef.current ?? undefined;
      },
    }),
    [controller]
  );

  if (enableNativeZoomGesture && props.zoom != null) {
    throw new Error(
      '`zoom` must not be set if `enableNativeZoomGesture` is enabled!'
    );
  }
  const gestureControllers = useGestureControllers(
    controller,
    enableNativeTapToFocusGesture,
    enableNativeZoomGesture
  );

  return (
    <NativePreviewView
      {...props}
      implementationMode={implementationMode}
      resizeMode={resizeMode}
      gestureControllers={gestureControllers}
      onPreviewStarted={callback(onPreviewStarted)}
      onPreviewStopped={callback(onPreviewStopped)}
      hybridRef={setHybridRef}
      previewOutput={previewOutput}
    />
  );
}

/**
 * A drop-in replacement for VisionCamera's Camera that uses the configurable
 * Better Preview native output.
 */
export const Camera = React.memo(CameraImpl);
