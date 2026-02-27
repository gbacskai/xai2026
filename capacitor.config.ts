import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xshopper.xaiworkspace',
  appName: 'xAI Workspace',
  webDir: 'dist/xaiworkspace/browser',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['chat.xaiworkspace.com', 'router.xaiworkspace.com'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#2D7AB8',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
