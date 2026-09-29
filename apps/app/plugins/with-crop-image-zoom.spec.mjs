import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { patchCropContract } = require('./with-crop-image-zoom.js');

const SAMPLE = `        CropImage.CROP_IMAGE_EXTRA_OPTIONS to CropImageOptions().apply {
          outputCompressQuality = 80
          cropShape = when (input.options.shape) {
            CropShape.RECTANGLE -> CropImageView.CropShape.RECTANGLE
          }
        }`;

describe('crop image zoom patch', () => {
  it('enables pinch zoom on the photo', () => {
    const patched = patchCropContract(SAMPLE);
    assert.match(patched, /multiTouchEnabled = true/);
    assert.match(patched, /autoZoomEnabled = true/);
    assert.match(patched, /maxZoom = 8/);
    assert.ok(patched.indexOf('multiTouchEnabled') < patched.indexOf('cropShape'));
  });

  it('does not insert the flags twice', () => {
    const once = patchCropContract(SAMPLE);
    assert.equal(patchCropContract(once), once);
  });
});
