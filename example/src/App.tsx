import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

export default function App() {
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
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow camera access</Text>
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

  return (
    <View style={styles.container}>
      <Camera device={device} isActive style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.badge}>
        <Text style={styles.badgeTitle}>Better Preview</Text>
        <Text style={styles.badgeText}>VisionCamera environment ready</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101114',
    padding: 32,
    gap: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  message: {
    color: '#c5c7ce',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#101114',
    fontSize: 16,
    fontWeight: '600',
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
