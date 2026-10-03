const googleMapsAndroidApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ?? '';
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

if (process.env.EAS_BUILD === 'true' && !googleMapsAndroidApiKey) {
  throw new Error(
    'GOOGLE_MAPS_ANDROID_API_KEY is required for EAS builds. Without it, opening the map crashes on Android.',
  );
}

/** @param {{ config: import('expo/config').ExpoConfig }} params */
module.exports = ({ config }) => {
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;

    return [
      plugin[0],
      {
        ...(plugin[1] ?? {}),
        android: {
          ...(plugin[1]?.android ?? {}),
          usesCleartextTraffic: !isProductionBuild,
          enableMinifyInReleaseBuilds: true,
        },
      },
    ];
  });

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsAndroidApiKey,
        },
      },
    },
    plugins: [...plugins, './plugins/with-google-maps.js', './plugins/with-crop-image-zoom.js'],
  };
};
