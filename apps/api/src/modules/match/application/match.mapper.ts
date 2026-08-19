import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { MatchCandidate, MatchCandidatesResult } from '../../../shared/domain/types';

export const MATCH_RADIUS_STEPS_KM = [50, 100, 200] as const;

@Injectable()
export class MatchCandidateMapper {
  constructor(private readonly supabase: SupabaseService) {}

  toResponse(candidate: MatchCandidate): Record<string, unknown> {
    const ownerPhotoUrls = (candidate.ownerPhotoUrls ?? []).map((url) =>
      this.supabase.normalizePublicUrl(url),
    );
    const pet = candidate.pet
      ? {
          ...candidate.pet,
          photoUrl: this.supabase.normalizePublicUrl(candidate.pet.photoUrl),
          photoUrls: (candidate.pet.photoUrls ?? []).map((url) =>
            this.supabase.normalizePublicUrl(url),
          ),
        }
      : null;

    return {
      user: {
        ...candidate.user,
        photoUrl: this.supabase.normalizePublicUrl(candidate.user.photoUrl),
        petPhotoUrl: this.supabase.normalizePublicUrl(candidate.user.petPhotoUrl),
      },
      pet,
      ownerAge: candidate.ownerAge ?? null,
      ownerBio: candidate.ownerBio ?? null,
      ownerPhotoUrls,
      lookingFor: candidate.lookingFor,
      distanceKm: candidate.distanceKm ?? null,
      sharedInterests: candidate.sharedInterests,
      sharedLookingFor: candidate.sharedLookingFor,
    };
  }

  toListResponse(result: MatchCandidatesResult) {
    return {
      radiusKm: result.radiusKm,
      candidates: result.candidates.map((c) => this.toResponse(c)),
    };
  }
}
