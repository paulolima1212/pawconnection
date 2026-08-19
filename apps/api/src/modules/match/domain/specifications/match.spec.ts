import { CompositeSpecification } from '../../../../shared/domain/specification';
import { AppConnectionIntent, AppInterest, UserEntity } from '../../../../shared/domain/types';

export class ExcludePassedUsersSpec extends CompositeSpecification<UserEntity> {
  constructor(private readonly passedIds: Set<string>) {
    super();
  }

  isSatisfiedBy(candidate: UserEntity): boolean {
    return !this.passedIds.has(candidate.id);
  }
}

export class WithinRadiusSpec extends CompositeSpecification<UserEntity> {
  constructor(
    private readonly lat: number,
    private readonly lng: number,
    private readonly radiusKm: number,
  ) {
    super();
  }

  isSatisfiedBy(candidate: UserEntity): boolean {
    if (
      candidate.latitude == null ||
      candidate.longitude == null ||
      this.radiusKm <= 0
    ) {
      return true;
    }
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(candidate.latitude - this.lat);
    const dLng = toRad(candidate.longitude - this.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(this.lat)) *
        Math.cos(toRad(candidate.latitude)) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= this.radiusKm;
  }
}

export class MatchingInterestSpec extends CompositeSpecification<UserEntity> {
  constructor(private readonly interests: AppInterest[]) {
    super();
  }

  isSatisfiedBy(candidate: UserEntity): boolean {
    if (this.interests.length === 0) return true;
    return candidate.interests.some((i) => this.interests.includes(i));
  }
}

export class MatchingLookingForSpec extends CompositeSpecification<UserEntity> {
  constructor(private readonly lookingFor: AppConnectionIntent[]) {
    super();
  }

  isSatisfiedBy(candidate: UserEntity): boolean {
    if (this.lookingFor.length === 0 || candidate.lookingFor.length === 0) {
      return true;
    }
    return candidate.lookingFor.some((intent) => this.lookingFor.includes(intent));
  }
}
