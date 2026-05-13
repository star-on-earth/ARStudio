import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Alert, Dimensions, Animated, Vibration, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');

// ── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  bg:     '#06060f',
  cyan:   '#00f5ff',
  purple: '#b441ff',
  pink:   '#ff2d78',
  white:  '#ffffff',
  dim:    'rgba(255,255,255,0.15)',
  glass:  'rgba(0,0,0,0.55)',
};

const FEATURES = [
  { key: 'marker', label: 'Marker',  icon: '🖼️',  color: C.cyan,   desc: 'Image\nTracking'  },
  { key: 'face',   label: 'Face',    icon: '😎',  color: C.purple, desc: 'Face\nFilter'     },
  { key: 'world',  label: 'World',   icon: '📦',  color: C.pink,   desc: 'World\nTracking'  },
];

export default function CameraScreen({ navigation }) {
  const [camPerm,    requestCamPerm]  = useCameraPermissions();
  const [micPerm,    requestMicPerm]  = useMicrophonePermissions();
  const [mediaPerm,  requestMediaPerm] = MediaLibrary.usePermissions();
  const [recording,  setRecording]    = useState(false);
  const [facing,     setFacing]       = useState('back');
  const [torchOn, setTorchOn] = useState(false);
  const [activeMode, setActiveMode]   = useState(null); // null = photo, 'video' = video mode
  const [recSeconds, setRecSeconds]   = useState(0);
  const cameraRef   = useRef(null);
  const holdTimer   = useRef(null);
  const recInterval = useRef(null);
  const captureAnim = useRef(new Animated.Value(1)).current;
  const recDot      = useRef(new Animated.Value(1)).current;

  // ── Permissions ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!camPerm?.granted)   await requestCamPerm();
      if (!micPerm?.granted)   await requestMicPerm();
      if (!mediaPerm?.granted) await requestMediaPerm();
    })();
  }, []);

  // Stop recording when leaving screen
  useFocusEffect(useCallback(() => {
    return () => {
      if (recording) stopRecording();
    };
  }, [recording]));

  // Blinking dot animation
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recDot, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(recDot, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recDot.stopAnimation();
      recDot.setValue(1);
    }
  }, [recording]);

  // ── Capture helpers ────────────────────────────────────────────────────
  const flashCapture = () => {
    Animated.sequence([
      Animated.timing(captureAnim, { toValue: 0.2, duration: 60,  useNativeDriver: true }),
      Animated.timing(captureAnim, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      flashCapture();
      Vibration.vibrate(40);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, skipProcessing: false });
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      Alert.alert('✓ Saved', 'Photo saved to your gallery.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || recording) return;
    try {
      setRecording(true);
      setRecSeconds(0);
      Vibration.vibrate(60);
      recInterval.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
      const video = await cameraRef.current.recordAsync({ maxDuration: 300 });
      await MediaLibrary.saveToLibraryAsync(video.uri);
      Alert.alert('✓ Saved', 'Video saved to your gallery.');
    } catch (e) {
      if (!e.message.includes('cancelled')) Alert.alert('Error', e.message);
    } finally {
      setRecording(false);
      clearInterval(recInterval.current);
      setRecSeconds(0);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !recording) return;
    Vibration.vibrate(40);
    cameraRef.current.stopRecording();
  };

  // Long-press to record, tap for photo
  const onPressIn = () => {
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      startRecording();
    }, 400);
  };

  const onPressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      if (!recording) takePhoto();
    } else if (recording) {
      stopRecording();
    }
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Permissions not granted ────────────────────────────────────────────
  if (!camPerm?.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>AR Studio needs your camera to work.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestCamPerm}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>

      {/* ── Camera preview ── */}
      <Animated.View style={[styles.cameraWrap, { opacity: captureAnim }]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torchOn}
          mode="picture"
          videoStabilizationMode="auto"
        />
      </Animated.View>

      {/* ── Recording timer ── */}
      {recording && (
        <View style={styles.recBadge}>
          <Animated.View style={[styles.recDot, { opacity: recDot }]} />
          <Text style={styles.recTime}>{fmtTime(recSeconds)}</Text>
        </View>
      )}

      {/* ── Left side: AR feature buttons ── */}
      <View style={styles.featureBar}>
        {FEATURES.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.featureBtn, { borderColor: f.color + '55' }]}
            onPress={() => navigation.navigate('AR', { feature: f.key })}
            activeOpacity={0.75}
          >
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: f.color }]}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Right side: Flash + Flip ── */}
      <View style={styles.rightBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setTorchOn(v => !v)}
        >
          <Text style={[styles.iconBtnText, torchOn && { color: '#ffdd00' }]}>
            {torchOn ? '⚡' : '🔦'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing(v => v === 'back' ? 'front' : 'back')}
        >
          <Text style={styles.iconBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>

        {/* Gallery placeholder */}
        <View style={styles.sideCtrl}>
          <View style={styles.galleryThumb}>
            <Text style={{ fontSize: 22 }}>🖼</Text>
          </View>
        </View>

        {/* Shutter / Record */}
        <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={styles.shutterOuter}>
            <Animated.View
              style={[
                styles.shutterInner,
                recording && styles.shutterRecording,
              ]}
            />
          </View>
        </TouchableWithoutFeedback>

        {/* Hint */}
        <View style={styles.sideCtrl}>
          <Text style={styles.hintText}>Tap photo{'\n'}Hold video</Text>
        </View>
      </View>

      {/* ── App title ── */}
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>AR STUDIO</Text>
      </View>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  cameraWrap: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 52,
    left: 0, right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  appTitle: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    fontSize: 11,
    letterSpacing: 5,
    color: 'rgba(0,245,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Recording badge
  recBadge: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 8,
  },
  recDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#ff2d78',
  },
  recTime: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Feature bar (left side)
  featureBar: {
    position: 'absolute',
    left: 12,
    top: 0, bottom: 0,
    justifyContent: 'center',
    gap: 14,
  },
  featureBtn: {
    width: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    backdropFilter: 'blur(10px)',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Right controls
  rightBar: {
    position: 'absolute',
    right: 12,
    top: 0, bottom: 100,
    justifyContent: 'center',
    gap: 14,
  },
  iconBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconBtnText: {
    fontSize: 20,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideCtrl: {
    width: 60,
    alignItems: 'center',
  },
  galleryThumb: {
    width: 52, height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Shutter button
  shutterOuter: {
    width: 76, height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  shutterRecording: {
    width: 28, height: 28,
    borderRadius: 6,
    backgroundColor: '#ff2d78',
  },

  // Permissions
  permContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permIcon: { fontSize: 52 },
  permTitle: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    fontSize: 18, fontWeight: '700',
    color: '#fff', textAlign: 'center',
  },
  permDesc: {
    fontSize: 14, color: 'rgba(200,215,255,0.5)',
    textAlign: 'center', lineHeight: 20,
  },
  permBtn: {
    backgroundColor: C.cyan,
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 10, marginTop: 8,
  },
  permBtnText: {
    color: '#000',
    fontWeight: '800', fontSize: 14, letterSpacing: 1,
  },
});
