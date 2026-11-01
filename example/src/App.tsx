import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  CommonResolutions,
  NativePreviewView,
  useCamera,
  useCameraDevice,
  useCameraPermission,
  type CameraDevice,
  type CameraPreviewOutput,
  type CameraRef,
  type Size,
  type PreviewView,
} from 'react-native-vision-camera';
import { callback } from 'react-native-nitro-modules';
import {
  createPreviewOutput,
  getUprightPreviewResolution,
  type BetterPreviewConfiguration,
} from 'react-native-vision-camera-better-preview';

import { FrameCornersInfo, useFrameCorners } from './useFrameCorners';

type Route = 'home' | 'vision-camera' | 'better-preview';

const resolutionOptions = Object.entries(CommonResolutions).map(
  ([label, size]) => ({ label, size })
);

function useResolutionOption(initialLabel: string) {
  const [label, setLabel] = useState(initialLabel);
  const [visible, setVisible] = useState(false);
  const option = resolutionOptions.find((item) => item.label === label)!;
  return { option, visible, setLabel, setVisible };
}

function ResolutionModal({
  title = 'Target resolution',
  visible,
  selected,
  onSelect,
  onClose,
}: {
  title?: string;
  visible: boolean;
  selected: string;
  onSelect: (label: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={resolutionOptions}
            keyExtractor={(item) => item.label}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.modalRow,
                  item.label === selected && styles.modalRowSelected,
                ]}
                onPress={() => {
                  onSelect(item.label);
                  onClose();
                }}
              >
                <Text style={styles.modalRowLabel}>{item.label}</Text>
                <Text style={styles.modalRowSize}>{formatSize(item.size)}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatSize(size: Size) {
  return `${size.width} × ${size.height}`;
}

interface PreviewScreenProps {
  device: CameraDevice;
  onBack: () => void;
}

function PreviewOverlay({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <View pointerEvents="none" style={styles.badge}>
        <Text style={styles.badgeTitle}>{title}</Text>
        <Text style={styles.badgeText}>{description}</Text>
      </View>
    </>
  );
}

function ControlButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.controlButton} onPress={onPress}>
      <Text style={styles.controlButtonText}>{label}</Text>
    </Pressable>
  );
}

function VisionCameraPreviewScreen({ device, onBack }: PreviewScreenProps) {
  const camera = useRef<CameraRef>(null);
  const resolution = useResolutionOption('HD_16_9');
  const corners = useFrameCorners(resolution.option.size);
  const [frameProcessorEnabled, setFrameProcessorEnabled] = useState(true);
  const outputs = useMemo(
    () => (frameProcessorEnabled ? [corners.frameOutput] : []),
    [frameProcessorEnabled, corners.frameOutput]
  );

  return (
    <View style={styles.previewContainer}>
      <Camera
        ref={camera}
        device={device}
        isActive
        outputs={outputs}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        onPreviewStarted={() => corners.setPreview(camera.current?.preview)}
        onLayout={corners.refresh}
      />
      {frameProcessorEnabled && <FrameCornersInfo {...corners} />}
      <View style={styles.controls}>
        <ControlButton
          label={`Frame processor: ${frameProcessorEnabled ? 'ON' : 'OFF'}`}
          onPress={() => setFrameProcessorEnabled((value) => !value)}
        />
        <ControlButton
          label={`Frame resolution: ${resolution.option.label}`}
          onPress={() => resolution.setVisible(true)}
        />
      </View>
      <ResolutionModal
        visible={resolution.visible}
        title="Frame resolution"
        selected={resolution.option.label}
        onSelect={resolution.setLabel}
        onClose={() => resolution.setVisible(false)}
      />
      <PreviewOverlay
        title="VisionCamera preview"
        description="The standard preview managed by the Camera component. The stock preview picks its own resolution; the modal sets the frame output's."
        onBack={onBack}
      />
    </View>
  );
}

function BetterPreviewScreen({ device, onBack }: PreviewScreenProps) {
  const [configuration, setConfiguration] =
    useState<BetterPreviewConfiguration>();
  const previewResolution = useResolutionOption('FHD_4_3');
  const frameResolution = useResolutionOption('HD_16_9');
  const [frameProcessorEnabled, setFrameProcessorEnabled] = useState(true);
  const previewOption = previewResolution.option;
  const previewOutput = useMemo(
    () =>
      createPreviewOutput({
        targetResolution: previewOption.size,
        onConfigurationChanged: setConfiguration,
      }) as CameraPreviewOutput,
    [previewOption]
  );
  const corners = useFrameCorners(frameResolution.option.size, configuration);
  const outputs = useMemo(
    () =>
      frameProcessorEnabled
        ? [previewOutput, corners.frameOutput]
        : [previewOutput],
    [previewOutput, corners.frameOutput, frameProcessorEnabled]
  );
  const setPreviewRef = useMemo(
    () =>
      callback((preview: PreviewView) => {
        corners.setPreview(preview);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [corners.setPreview]
  );

  useCamera({ device, isActive: true, outputs });

  const uprightResolution = getUprightPreviewResolution(configuration);
  const resolutionLabel =
    uprightResolution == null
      ? 'Waiting for the native preview configuration...'
      : `Native output: ${uprightResolution.width} × ${uprightResolution.height}`;

  return (
    <View style={styles.previewContainer}>
      <NativePreviewView
        previewOutput={previewOutput}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        hybridRef={setPreviewRef}
        onLayout={corners.refresh}
      />
      {frameProcessorEnabled && <FrameCornersInfo {...corners} />}
      <View style={styles.controls}>
        <ControlButton
          label={`Frame processor: ${frameProcessorEnabled ? 'ON' : 'OFF'}`}
          onPress={() => setFrameProcessorEnabled((value) => !value)}
        />
        <ControlButton
          label={`Preview resolution: ${previewOption.label}`}
          onPress={() => previewResolution.setVisible(true)}
        />
        <ControlButton
          label={`Frame resolution: ${frameResolution.option.label}`}
          onPress={() => frameResolution.setVisible(true)}
        />
      </View>
      <ResolutionModal
        title="Preview resolution"
        visible={previewResolution.visible}
        selected={previewOption.label}
        onSelect={(label) => {
          setConfiguration(undefined);
          previewResolution.setLabel(label);
        }}
        onClose={() => previewResolution.setVisible(false)}
      />
      <ResolutionModal
        title="Frame resolution"
        visible={frameResolution.visible}
        selected={frameResolution.option.label}
        onSelect={frameResolution.setLabel}
        onClose={() => frameResolution.setVisible(false)}
      />
      <PreviewOverlay
        title="Better Preview"
        description={resolutionLabel}
        onBack={onBack}
      />
    </View>
  );
}

function RoutePicker({ onSelect }: { onSelect: (route: Route) => void }) {
  return (
    <View style={styles.menuContainer}>
      <Text style={styles.eyebrow}>EXAMPLE APP</Text>
      <Text style={styles.title}>Choose a preview</Text>
      <Text style={styles.message}>
        Compare VisionCamera's regular preview with the custom native preview
        output.
      </Text>

      <Pressable
        style={styles.routeCard}
        onPress={() => onSelect('vision-camera')}
      >
        <Text style={styles.routeTitle}>VisionCamera preview</Text>
        <Text style={styles.routeDescription}>
          Uses the standard Camera component and its built-in preview output.
        </Text>
      </Pressable>

      <Pressable
        style={styles.routeCard}
        onPress={() => onSelect('better-preview')}
      >
        <Text style={styles.routeTitle}>Better Preview</Text>
        <Text style={styles.routeDescription}>
          Uses the custom native output with a preferred 1920 × 1080 resolution.
        </Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>('home');
  const device = useCameraDevice('back');
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();

  if (!hasPermission) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Better Preview</Text>
        <Text style={styles.message}>
          Camera permission is required to run the example app.
        </Text>
        {canRequestPermission ? (
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Allow camera access</Text>
          </Pressable>
        ) : (
          <Text style={styles.message}>
            Enable camera access in the system settings.
          </Text>
        )}
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.title}>No back camera found</Text>
      </View>
    );
  }

  if (route === 'vision-camera') {
    return (
      <VisionCameraPreviewScreen
        device={device}
        onBack={() => setRoute('home')}
      />
    );
  }

  if (route === 'better-preview') {
    return (
      <BetterPreviewScreen device={device} onBack={() => setRoute('home')} />
    );
  }

  return <RoutePicker onSelect={setRoute} />;
}

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: '#050505',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#101114',
    padding: 24,
    gap: 14,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101114',
    padding: 32,
    gap: 16,
  },
  eyebrow: {
    color: '#8f94a3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
  },
  message: {
    color: '#c5c7ce',
    fontSize: 16,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: '#101114',
    fontSize: 16,
    fontWeight: '600',
  },
  routeCard: {
    borderWidth: 1,
    borderColor: '#343741',
    borderRadius: 18,
    backgroundColor: '#1a1c21',
    padding: 20,
    gap: 7,
  },
  routeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  routeDescription: {
    color: '#aeb2bd',
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  controls: {
    position: 'absolute',
    top: 52,
    right: 20,
    alignItems: 'flex-end',
    gap: 8,
  },
  controlButton: {
    borderRadius: 999,
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 24,
  },
  modalCard: {
    maxHeight: '75%',
    borderRadius: 18,
    backgroundColor: '#1a1c21',
    padding: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalRowSelected: {
    backgroundColor: '#343741',
  },
  modalRowLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalRowSize: {
    color: '#aeb2bd',
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
    padding: 16,
  },
  badgeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  badgeText: {
    color: '#c5c7ce',
    fontSize: 14,
    marginTop: 4,
  },
});
