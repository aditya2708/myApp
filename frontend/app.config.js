const IS_DEV = process.env.APP_VARIANT === 'dev';

export default {
  expo: {
    name: IS_DEV ? "BPEXPO2 Dev" : "BPEXPO2",
    slug: "BPEXPO2",
    version: "1.0.3",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon.png",
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
        foregroundImage: "./assets/icon.png",
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
    },
    web: {
      favicon: "./assets/favicon.png"
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
      "expo-audio"
    ],
    extra: {
      eas: {
        projectId: "2e83c4d0-499c-413b-ad59-f173fff2ae4f"
      }
    }
  }
};