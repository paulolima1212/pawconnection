import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { applyPlayReleaseManifest } = require('./with-play-release-manifest.js');

function manifest() {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      'uses-permission': [
        { $: { 'android:name': 'android.permission.WRITE_EXTERNAL_STORAGE' } },
        { $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } },
        { $: { 'android:name': 'android.permission.CAMERA' } },
      ],
      application: [
        {
          service: [
            {
              $: {
                'android:name': 'expo.modules.location.services.LocationTaskService',
                'android:foregroundServiceType': 'location',
              },
            },
          ],
        },
      ],
    },
  };
}

describe('Play release manifest', () => {
  it('caps storage write, drops the overlay, and removes the unused location service', () => {
    const result = applyPlayReleaseManifest(manifest());
    const permissions = result.manifest['uses-permission'];
    const write = permissions.find(
      (permission) => permission.$['android:name'] === 'android.permission.WRITE_EXTERNAL_STORAGE',
    );
    const overlay = permissions.find(
      (permission) => permission.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW',
    );
    const camera = permissions.find(
      (permission) => permission.$['android:name'] === 'android.permission.CAMERA',
    );
    const service = result.manifest.application[0].service.find(
      (item) => item.$['android:name'] === 'expo.modules.location.services.LocationTaskService',
    );

    assert.equal(write.$['android:maxSdkVersion'], '28');
    assert.equal(overlay.$['tools:node'], 'remove');
    assert.equal(camera.$['android:name'], 'android.permission.CAMERA');
    assert.equal(service.$['tools:node'], 'remove');
    assert.equal(service.$['android:foregroundServiceType'], undefined);
  });
});
