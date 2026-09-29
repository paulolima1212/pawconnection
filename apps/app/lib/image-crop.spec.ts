import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cropRectFromFrame } from './image-crop';

describe('profile image crop', () => {
  it('uses the full frame of a square photo', () => {
    const crop = cropRectFromFrame({
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewport: 100,
      imageWidth: 100,
      imageHeight: 100,
    });
    assert.deepEqual(crop, { originX: 0, originY: 0, width: 100, height: 100 });
  });

  it('keeps the centered square of a landscape photo', () => {
    const crop = cropRectFromFrame({
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewport: 100,
      imageWidth: 200,
      imageHeight: 100,
    });
    assert.deepEqual(crop, { originX: 50, originY: 0, width: 100, height: 100 });
  });

  it('keeps the centered square of a portrait photo', () => {
    const crop = cropRectFromFrame({
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewport: 100,
      imageWidth: 100,
      imageHeight: 200,
    });
    assert.deepEqual(crop, { originX: 0, originY: 50, width: 100, height: 100 });
  });

  it('returns the same crop when the framing is reapplied', () => {
    const frame = {
      scale: 2,
      translateX: 10,
      translateY: -4,
      viewport: 120,
      imageWidth: 400,
      imageHeight: 300,
    };
    assert.deepEqual(cropRectFromFrame(frame), cropRectFromFrame(frame));
  });
});
