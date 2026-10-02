import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codefox.app',
  appName: 'CodeFox',
  webDir: 'out',
  server: {
    // App nativa carga tu web en producción (API + auth funcionan)
    url: 'https://code-fox-ia.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
