const fs = require('fs');
const path = require('path');

const CROP_CONTRACT = path.join(
  'node_modules',
  'expo-image-picker',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'imagepicker',
  'contracts',
  'CropImageContract.kt',
);

const ZOOM_OPTIONS = `          multiTouchEnabled = true
          autoZoomEnabled = true
          maxZoom = 8

`;

const CROP_SHAPE = '          cropShape = when (input.options.shape) {';

/**
 * CanHub leaves pinch-zoom off, so the editor only resizes the crop window.
 * Insert the zoom flags into expo-image-picker's crop contract.
 * @param {string} source
 */
function patchCropContract(source) {
  if (source.includes('multiTouchEnabled = true')) return source;
  if (!source.includes(CROP_SHAPE)) {
    throw new Error('expo-image-picker crop contract changed; cannot enable photo zoom.');
  }
  return source.replace(CROP_SHAPE, `${ZOOM_OPTIONS}${CROP_SHAPE}`);
}

function enableCropImageZoom(projectRoot) {
  const file = path.join(projectRoot, CROP_CONTRACT);
  if (!fs.existsSync(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  const next = patchCropContract(source);
  if (next !== source) fs.writeFileSync(file, next);
}

/** @param {import('expo/config').ExpoConfig} config */
module.exports = function withCropImageZoom(config) {
  enableCropImageZoom(path.join(__dirname, '..'));
  return config;
};

module.exports.patchCropContract = patchCropContract;
