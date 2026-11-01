import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  CommonResolutions,
  NativePreviewView,
  useCamera,
  useCameraDevice,
  useCameraPermission,
  type CameraDevice,
  type CameraPreviewOutput,
} from 'react-native-vision-camera';
import {
  createPreviewOutput,
  getUprightPreviewResolution,
  type BetterPreviewConfiguration,
} from 'react-native-vision-camera-better-preview';

type Route = 'home' | 'vision-camera' | 'better-preview';

const targetResolution = CommonResolutions.FHD_4_3;

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

function VisionCameraPreviewScreen({ device, onBack }: PreviewScreenProps) {
  return (
    <View style={styles.previewContainer}>
      <Camera
        device={device}
        isActive
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />
      <PreviewOverlay
        title="VisionCamera preview"
        description="The standard preview managed by the Camera component."
        onBack={onBack}
      />
    </View>
  );
}

function BetterPreviewScreen({ device, onBack }: PreviewScreenProps) {
  const [configuration, setConfiguration] =
    useState<BetterPreviewConfiguration>();
  const previewOutput = useMemo(
    () =>
      createPreviewOutput({
        targetResolution,
        onConfigurationChanged: setConfiguration,
      }) as CameraPreviewOutput,
    []
  );
  const outputs = useMemo(() => [previewOutput], [previewOutput]);

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
