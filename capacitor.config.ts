import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.leadflow.crm',
  appName: 'LeadFlow CRM',
  webDir: 'out',
  server: {
    // When your CRM is deployed (e.g. Vercel/Railway), set the URL here:
    // url: 'https://your-crm.vercel.app',
    // For local emulator/phone testing:
    // url: 'http://10.0.2.2:3000',
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
