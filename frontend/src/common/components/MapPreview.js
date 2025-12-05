import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const isValidCoordinate = (value) => Number.isFinite(value);

const buildLeafletHtml = (latitude, longitude, label, isStale) => {
  const safeLabel =
    typeof label === 'string' && label.trim().length > 0 ? label.trim() : 'Lokasi';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
        .leaflet-container { background: #eef2f5; }
        .leaflet-control-container { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const lat = ${latitude};
        const lon = ${longitude};
        const map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          tap: false,
        }).setView([lat, lon], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([lat, lon], { title: ${JSON.stringify(safeLabel)} }).addTo(map);

        if (${isStale}) {
          marker.bindPopup('Lokasi membutuhkan pembaruan').openPopup();
        }
      </script>
    </body>
  </html>
  `;
};

const MapPreview = ({
  location,
  isStale = false,
  label = 'Lokasi',
  height = 180,
}) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const hasCoords = isValidCoordinate(latitude) && isValidCoordinate(longitude);
  const leafletHtml = useMemo(() => {
    if (!hasCoords) {
      return '';
    }
    return buildLeafletHtml(latitude, longitude, label, isStale);
  }, [hasCoords, latitude, longitude, label, isStale]);

  if (!hasCoords) {
    return (
      <View style={[styles.container, styles.fallbackContainer, { height }]}>
        <View style={styles.fallbackContent}>
          <Ionicons name="map-outline" size={28} color="#95a5a6" />
          <Text style={styles.fallbackTitle}>Lokasi belum tersedia</Text>
          <Text style={styles.fallbackText}>
            Ambil lokasi untuk menampilkan mini map.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        style={StyleSheet.absoluteFill}
        source={{ html: leafletHtml }}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.overlay}>
        <View
          style={[styles.badge, isStale ? styles.badgeWarning : styles.badgeReady]}
        >
          <Ionicons
            name={isStale ? 'alert-circle' : 'checkmark-circle'}
            size={16}
            color="#fff"
          />
          <Text style={styles.badgeText}>
            {isStale ? 'Butuh pembaruan' : 'Lokasi siap'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eef2f5',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fallbackContent: {
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 6,
  },
  fallbackText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 2,
  },
  overlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeReady: {
    backgroundColor: '#27ae60',
  },
  badgeWarning: {
    backgroundColor: '#f39c12',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default MapPreview;
