/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const googleMapsAndroidApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ?? '';
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

const plugins = (appJson.expo.plugins ?? []).map((plugin) => {
  if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;

  return [
    plugin[0],
    {
      ...(plugin[1] ?? {}),
      android: {
        ...(plugin[1]?.android ?? {}),
        usesCleartextTraffic: !isProductionBuild,
      },
    },
  ];
});

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      ...appJson.expo.android?.config,
      googleMaps: {
        apiKey: googleMapsAndroidApiKey,
      },
    },
  },
  plugins: [...plugins, './plugins/with-google-maps.js'],
};
