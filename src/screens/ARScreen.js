import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Vibration,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { getMarkerHTML } from '../ar/markerAR';
import { getFaceHTML } from '../ar/faceAR';
import { getWorldHTML } from '../ar/worldAR';

const FEATURE_META = {
  marker: { label: 'Marker Tracking', color: '#00f5ff', icon: '🖼️' },
  face:   { label: 'Face Filter',     color: '#b441ff', icon: '😎' },
  world:  { label: 'World Tracking',  color: '#ff2d78', icon: '📦' },
};

function getHTML(feature) {
  if (feature === 'marker') return getMarkerHTML();
  if (feature === 'face')   return getFaceHTML();
  if (feature === 'world')  return getWorldHTML();
  return '<html><body><p style="color:white">Unknown feature</p></body></html>';
}

export default function ARScreen({ navigation, route }) {
  const { feature } = route.params;
  const meta        = FEATURE_META[feature];
  const webviewRef  = useRef(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  // ── Save photo sent from WebView ────────────────────────────────────────
  const handleCapture = async (base64Data) => {
    if (saving) return;
    setSaving(true);
    Vibration.vibrate(40);
    try {
      // Strip data URL prefix
      const raw = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const uri = FileSystem.cacheDirectory + `ar_capture_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(uri, raw, { encoding: 'base64' });
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('AR Studio', asset, false);
      Alert.alert('✓ Saved', 'AR photo saved to your gallery.');
    } catch (e) {
      Alert.alert('Error saving', e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Messages from the WebView page ─────────────────────────────────────
  const onMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'capture' && msg.data) {
        handleCapture(msg.data);
      }
    } catch {}
  };

  // ── Trigger capture inside the WebView ─────────────────────────────────
  const requestCapture = () => {
    webviewRef.current?.injectJavaScript('window.captureARFrame && window.captureARFrame(); true;');
  };

  return (
    <View style={styles.root}>

      {/* WebView for the AR experience */}
      <WebView
        ref={webviewRef}
        style={StyleSheet.absoluteFill}
        source={{ html: getHTML(feature), baseUrl: 'https://localhost' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        allowUniversalAccessFromFileURLs={true}
        allowFileAccess={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={onMessage}
        // Android: grant camera / mic to WebView automatically
        onPermissionRequest={(e) => e.nativeEvent.request.grant(e.nativeEvent.request.resources)}
        originWhitelist={['*']}
        mixedContentMode="always"
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={meta.color} />
          <Text style={[styles.loadingText, { color: meta.color }]}>
            Loading {meta.label}…
          </Text>
        </View>
      )}

      {/* Saving overlay */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.savingText}>Saving…</Text>
        </View>
      )}

      {/* Top bar */}
      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={[styles.backBtnText, { color: meta.color }]}>← Back</Text>
        </TouchableOpacity>

        <View style={[styles.badge, { borderColor: meta.color + '44' }]}>
          <Text style={styles.badgeIcon}>{meta.icon}</Text>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {/* Capture button (native overlay) */}
      <View style={styles.captureBar} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.captureBtn, { borderColor: meta.color }]}
          onPress={requestCapture}
          activeOpacity={0.8}
        >
          <View style={[styles.captureInner, { backgroundColor: meta.color }]} />
        </TouchableOpacity>
        <Text style={[styles.captureHint, { color: meta.color + 'aa' }]}>
          Capture
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#06060f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 50,
  },
  loadingText: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  savingOverlay: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 200,
  },
  savingText: {
    color: '#fff', fontSize: 13,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
  },

  topBar: {
    position: 'absolute',
    top: 52,
    left: 16, right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeIcon: { fontSize: 14 },
  badgeText: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  captureBar: {
    position: 'absolute',
    bottom: 40,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 100,
    gap: 8,
  },
  captureBtn: {
    width: 68, height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureInner: {
    width: 52, height: 52,
    borderRadius: 26,
    opacity: 0.9,
  },
  captureHint: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
