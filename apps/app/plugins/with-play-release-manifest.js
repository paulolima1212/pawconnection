const { withAndroidManifest } = require('expo/config-plugins');

const WRITE_STORAGE = 'android.permission.WRITE_EXTERNAL_STORAGE';
const OVERLAY = 'android.permission.SYSTEM_ALERT_WINDOW';
const LOCATION_TASK_SERVICE = 'expo.modules.location.services.LocationTaskService';

/**
 * Play's generated APK for versionCode 23 still declares a location foreground
 * service without FOREGROUND_SERVICE_LOCATION, an uncapped storage write, and
 * the overlay permission. The app only uses location and photos while open.
 * @param {{ manifest: Record<string, any> }} androidManifest
 */
function applyPlayReleaseManifest(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest.$ = manifest.$ ?? {};
  if (!manifest.$['xmlns:tools']) {
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  }

  const permissions = manifest['uses-permission'] ?? [];
  manifest['uses-permission'] = permissions
    .filter((permission) => permission.$?.['android:name'] !== OVERLAY)
    .concat({
      $: {
        'android:name': OVERLAY,
        'tools:node': 'remove',
      },
    });

  const write = manifest['uses-permission'].find(
    (permission) => permission.$?.['android:name'] === WRITE_STORAGE,
  );
  if (write) {
    write.$['android:maxSdkVersion'] = '28';
    write.$['tools:replace'] = 'android:maxSdkVersion';
  } else {
    manifest['uses-permission'].push({
      $: {
        'android:name': WRITE_STORAGE,
        'android:maxSdkVersion': '28',
        'tools:replace': 'android:maxSdkVersion',
      },
    });
  }

  const application = manifest.application?.[0];
  if (application) {
    const services = application.service ?? [];
    application.service = services
      .filter((service) => service.$?.['android:name'] !== LOCATION_TASK_SERVICE)
      .concat({
        $: {
          'android:name': LOCATION_TASK_SERVICE,
          'tools:node': 'remove',
        },
      });
  }

  return androidManifest;
}

/** @param {import('expo/config').ExpoConfig} config */
function withPlayReleaseManifest(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = applyPlayReleaseManifest(config.modResults);
    return config;
  });
}

module.exports = withPlayReleaseManifest;
module.exports.applyPlayReleaseManifest = applyPlayReleaseManifest;
