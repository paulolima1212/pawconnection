/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const googleMapsAndroidApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() ?? '';

module.exports = {
  expo: {
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
    plugins: [...(appJson.expo.plugins ?? []), './plugins/with-google-maps.js'],
  },
};
