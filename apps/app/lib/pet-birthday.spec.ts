import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { interpretBirthday, ownerBirthdayRules, petBirthdayRules } from './pet-birthday';

const now = new Date(2026, 8, 26);

describe('date of birth', () => {
  it('accepts a manually typed owner date', () => {
    const result = interpretBirthday('12/04/1990', ownerBirthdayRules(), now);
    assert.equal(result.iso, '1990-04-12');
    assert.equal(result.error, null);
  });

  it('accepts the same date chosen from the calendar as YYYY-MM-DD', () => {
    const result = interpretBirthday('1990-04-12', ownerBirthdayRules(), now);
    assert.equal(result.iso, '1990-04-12');
  });

  it('rejects an impossible date', () => {
    const result = interpretBirthday('31/02/2020', ownerBirthdayRules(), now);
    assert.equal(result.iso, null);
    assert.match(result.error ?? '', /valid date/);
  });

  it('rejects a future date', () => {
    const result = interpretBirthday('27/09/2026', petBirthdayRules(), now);
    assert.equal(result.iso, null);
    assert.match(result.error ?? '', /future/);
  });

  it('accepts dog ages 0 and 16 and rejects 17', () => {
    assert.equal(interpretBirthday('26/09/2026', petBirthdayRules(), now).iso, '2026-09-26');
    assert.equal(interpretBirthday('26/09/2010', petBirthdayRules(), now).iso, '2010-09-26');
    assert.equal(interpretBirthday('25/09/2009', petBirthdayRules(), now).iso, null);
  });
});
