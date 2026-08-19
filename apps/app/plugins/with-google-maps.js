const { AndroidConfig } = require('expo/config-plugins');

/** Injects com.google.android.geo.API_KEY into AndroidManifest from android.config.googleMaps.apiKey. */
module.exports = (config) => AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey(config);
