import path from 'path';

const IS_DEV = process.env.APP_VARIANT === 'dev';
const assetPath = (file) => path.resolve(__dirname, file);

export default {
  expo: {
    name: IS_DEV ? "BPEXPO2 Dev" : "BPEXPO2",
    slug: "BPEXPO2",
    version: "1.0.3",
    orientation: "portrait",
    icon: assetPath('./assets/icon.png'),
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: assetPath('./assets/icon.png'),
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? "com.anonymous.BPEXPO2.dev" : "com.anonymous.BPEXPO2",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to scan QR codes for attendance tracking."
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: assetPath('./assets/icon.png'),
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: IS_DEV ? "com.anonymous.BPEXPO2.dev" : "com.anonymous.BPEXPO2",
      permissions: [
        "CAMERA",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      usesCleartextTraffic: true
    },
    web: {
      favicon: assetPath('./assets/favicon.png')
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "This app uses location to verify attendance at shelter activities."
        }
      ],
      "expo-audio",
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            useLegacyPackaging: true
          }
        }
      ]
    ],
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:9000",
      managementBaseUrl: process.env.EXPO_PUBLIC_MANAGEMENT_BASE_URL || "http://127.0.0.1:8000",
      eas: {
        // projectId: "2e83c4d0-499c-413b-ad59-f173fff2ae4f"
        "projectId": "6f64b611-69a2-400f-b9b0-8ca4cc19045a"
      }
    }
  }
};
