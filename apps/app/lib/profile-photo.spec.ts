import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NATIVE_PROFILE_CROP,
  PROFILE_PHOTO_MAX_EDGE,
  profilePhotoPatch,
  profilePhotoResizeAction,
} from './profile-photo';

describe('profile photo change', () => {
  it('uses the system gallery crop with a square circular frame', () => {
    assert.equal(NATIVE_PROFILE_CROP.allowsEditing, true);
    assert.deepEqual(NATIVE_PROFILE_CROP.aspect, [1, 1]);
    assert.equal(NATIVE_PROFILE_CROP.shape, 'oval');
  });

  it('shrinks a large landscape photo to the upload limit', () => {
    assert.deepEqual(profilePhotoResizeAction(4000, 3000), {
      resize: { width: PROFILE_PHOTO_MAX_EDGE },
    });
  });

  it('shrinks a large portrait photo by its long edge', () => {
    assert.deepEqual(profilePhotoResizeAction(1200, 3000), {
      resize: { height: PROFILE_PHOTO_MAX_EDGE },
    });
  });

  it('does not enlarge a photo that is already small enough', () => {
    assert.equal(profilePhotoResizeAction(800, 800), null);
  });

  it('saves only the photo url for the owner and the dog', () => {
    const body = profilePhotoPatch('https://cdn.example/uploads/photo.jpg');
    assert.deepEqual(body, { photoUrl: 'https://cdn.example/uploads/photo.jpg' });
    assert.equal('birthDate' in body, false);
    assert.equal('age' in body, false);
    assert.equal('temperament' in body, false);
  });
});
