const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

<<<<<<< HEAD
// react-native-maps is native-only; the components that use it already guard
// on Platform.OS === 'web' at runtime. Resolve it to an empty module on web so
// the web bundle does not fail on its native-only internal imports.
=======
// react-native-maps is native-only; map components already guard on
// Platform.OS === 'web'. Resolve to empty on web so Expo web can bundle.
>>>>>>> release/v1.0.3
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'empty' };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
