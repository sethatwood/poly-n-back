import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polynback',
  appName: 'Poly N-Back',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0f1729',
  },
  ios: {
    backgroundColor: '#0f1729',
  },
};

export default config;
