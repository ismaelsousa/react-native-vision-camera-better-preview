import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera as VisionCamera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  type CameraDevice,
  type Size,
} from 'react-native-vision-camera';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Camera as BetterPreviewCamera,
  getUprightPreviewResolution,
  type BetterPreviewConfiguration,
  type CameraRef,
} from 'react-native-vision-camera-better-preview';

import { AspectRatioContentLayout } from './AspectRatioContentLayout';
import { FrameCornersInfo, useFrameCorners } from './useFrameCorners';

type Route = 'home' | 'vision-camera' | 'better-preview' | 'responsive-preview';

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

function PreviewLayout({
  title,
  description,
  onBack,
  controls,
  children,
}: {
  title: string;
  description: string;
  onBack: () => void;
  controls: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.previewContainer}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <View style={styles.controls}>{controls}</View>
      </View>
      {/* The preview and its dots share this area, so view coordinates match. */}
      <View style={styles.previewArea}>{children}</View>
      <View pointerEvents="none" style={styles.badge}>
        <Text style={styles.badgeTitle}>{title}</Text>
        <Text style={styles.badgeText}>{description}</Text>
      </View>
    </SafeAreaView>
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
    <PreviewLayout
      title="VisionCamera preview"
      description="The standard preview managed by the Camera component. The stock preview picks its own resolution; the modal sets the frame output's."
      onBack={onBack}
      controls={
        <>
          <ControlButton
            label={`Frame processor: ${frameProcessorEnabled ? 'ON' : 'OFF'}`}
            onPress={() => setFrameProcessorEnabled((value) => !value)}
          />
          <ControlButton
            label={`Frame resolution: ${resolution.option.label}`}
            onPress={() => resolution.setVisible(true)}
          />
        </>
      }
    >
      <VisionCamera
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
      <ResolutionModal
        visible={resolution.visible}
        title="Frame resolution"
        selected={resolution.option.label}
        onSelect={resolution.setLabel}
        onClose={() => resolution.setVisible(false)}
      />
    </PreviewLayout>
  );
}

function BetterPreviewScreen({ device, onBack }: PreviewScreenProps) {
  const camera = useRef<CameraRef>(null);
  const [configuration, setConfiguration] =
    useState<BetterPreviewConfiguration>();
  const previewResolution = useResolutionOption('FHD_4_3');
  const frameResolution = useResolutionOption('HD_16_9');
  const [frameProcessorEnabled, setFrameProcessorEnabled] = useState(true);
  const previewOption = previewResolution.option;
  const corners = useFrameCorners(frameResolution.option.size, configuration);
  const outputs = useMemo(
    () => (frameProcessorEnabled ? [corners.frameOutput] : []),
    [corners.frameOutput, frameProcessorEnabled]
  );

  const uprightResolution = getUprightPreviewResolution(configuration);
  const resolutionLabel =
    uprightResolution == null
      ? 'Waiting for the native preview configuration...'
      : `Native output: ${uprightResolution.width} × ${uprightResolution.height}`;

  return (
    <PreviewLayout
      title="Better Preview"
      description={resolutionLabel}
      onBack={onBack}
      controls={
        <>
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
        </>
      }
    >
      <BetterPreviewCamera
        ref={camera}
        device={device}
        isActive
        outputs={outputs}
        previewTargetResolution={previewOption.size}
        onPreviewConfigurationChanged={setConfiguration}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        onPreviewStarted={() => corners.setPreview(camera.current?.preview)}
        onLayout={corners.refresh}
      />
      {frameProcessorEnabled && <FrameCornersInfo {...corners} />}
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
    </PreviewLayout>
  );
}

function ResponsivePreviewScreen({ device, onBack }: PreviewScreenProps) {
  const insets = useSafeAreaInsets();
  const previewResolution = useResolutionOption('FHD_4_3');
  const [resolvedPreviewSize, setResolvedPreviewSize] = useState<Size>();
  const [compactSpace, setCompactSpace] = useState(false);
  const [triggerActive, setTriggerActive] = useState(false);
  const previewOption = previewResolution.option;
  const displayedSize = resolvedPreviewSize ?? previewOption.size;
  const aspectRatio = displayedSize.width / displayedSize.height;

  return (
    <View
      style={[
        styles.responsivePreviewScreen,
        {
          paddingTop: insets.top,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
        },
      ]}
    >
      <View
        style={[
          styles.responsiveDemoArea,
          compactSpace && styles.responsiveDemoAreaCompact,
        ]}
      >
        <AspectRatioContentLayout
          aspectRatio={aspectRatio}
          frameStyle={styles.responsivePreviewFrame}
          top={
            <View style={styles.responsiveTopSlot}>
              <Pressable
                accessibilityLabel="Close preview"
                style={styles.closeButton}
                onPress={onBack}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
              <View style={styles.responsiveTopActions}>
                <ControlButton
                  label={`Preview: ${previewOption.label}`}
                  onPress={() => previewResolution.setVisible(true)}
                />
                <ControlButton
                  label={compactSpace ? 'Use full space' : 'Reduce space'}
                  onPress={() => setCompactSpace((value) => !value)}
                />
              </View>
            </View>
          }
          bottom={
            <View style={styles.responsiveBottomSlot}>
              <Text style={styles.responsiveResolutionLabel}>
                {displayedSize.width} × {displayedSize.height}
              </Text>
              <Pressable
                accessibilityLabel="Camera trigger"
                style={styles.triggerButton}
                onPress={() => setTriggerActive((value) => !value)}
              >
                <View
                  style={[
                    styles.triggerButtonInner,
                    triggerActive && styles.triggerButtonInnerActive,
                  ]}
                />
              </Pressable>
            </View>
          }
        >
          <BetterPreviewCamera
            device={device}
            isActive
            previewTargetResolution={previewOption.size}
            onPreviewResolution={setResolvedPreviewSize}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </AspectRatioContentLayout>
      </View>

      <ResolutionModal
        title="Preview resolution"
        visible={previewResolution.visible}
        selected={previewOption.label}
        onSelect={(label) => {
          setResolvedPreviewSize(undefined);
          previewResolution.setLabel(label);
        }}
        onClose={() => previewResolution.setVisible(false)}
      />
    </View>
  );
}

function RoutePicker({
  onSelect,
  responsivePreviewSupported,
}: {
  onSelect: (route: Route) => void;
  responsivePreviewSupported: boolean;
}) {
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

      <Pressable
        disabled={!responsivePreviewSupported}
        style={[
          styles.routeCard,
          !responsivePreviewSupported && styles.routeCardDisabled,
        ]}
        onPress={() => onSelect('responsive-preview')}
      >
        <Text style={styles.routeTitle}>Responsive preview layout</Text>
        <Text style={styles.routeDescription}>
          {responsivePreviewSupported
            ? 'Change preview resolution and available space to see the close and trigger controls move with the camera frame.'
            : 'Requires iOS 17 or newer.'}
        </Text>
      </Pressable>
    </View>
  );
}

function AppContent() {
  const [route, setRoute] = useState<Route>('home');
  const device = useCameraDevice('back');
  const iosMajorVersion = Number.parseInt(String(Platform.Version), 10);
  const responsivePreviewSupported =
    Platform.OS !== 'ios' || iosMajorVersion >= 17;
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

  if (route === 'responsive-preview' && responsivePreviewSupported) {
    return (
      <ResponsivePreviewScreen
        device={device}
        onBack={() => setRoute('home')}
      />
    );
  }

  return (
    <RoutePicker
      onSelect={setRoute}
      responsivePreviewSupported={responsivePreviewSupported}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
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
  routeCardDisabled: {
    opacity: 0.45,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  previewArea: {
    flex: 1,
  },
  backButton: {
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
    flex: 1,
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
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
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
  responsivePreviewScreen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#101114',
  },
  responsiveDemoArea: {
    flex: 1,
    overflow: 'hidden',
  },
  responsiveDemoAreaCompact: {
    flex: 0,
    height: '62%',
  },
  responsivePreviewFrame: {
    backgroundColor: '#050505',
  },
  responsiveTopSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
  },
  responsiveTopActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },
  responsiveBottomSlot: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  responsiveResolutionLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 999,
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    borderRadius: 36,
    backgroundColor: 'rgba(10, 10, 12, 0.35)',
  },
  triggerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  triggerButtonInnerActive: {
    backgroundColor: '#ff3b30',
    transform: [{ scale: 0.78 }],
  },
});
