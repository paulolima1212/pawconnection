import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/auth';
import * as profileApi from '@/lib/api/profile';
import { withTimeout } from '@/lib/api/client';
import { profileMeToDraft } from '@/lib/api/profile-mapper';
import type { ProfileMeResponse } from '@/lib/api/types';
import { resolveRemoteUri, isHttpUrl } from '@/lib/api/media';
import { isValidHandle } from '@/lib/handle';
import { ageFromBirthdayIso } from '@/lib/pet-birthday';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safe-async-storage';

const STORAGE_DONE = 'paw_onboarding_complete_v1';
const STORAGE_DRAFT = 'paw_profile_draft_v1';

/** Dog-owner interests (Figma onboarding / AppInterest). */
export const INTEREST_OPTIONS = [
  'Friendship',
  'Dog friendly locations',
  'Dog services',
  'Dog playdates',
  'All the above',
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number];

/** Connection request intent sent to API — always Friendship for dog-owner connects. */
export const CONNECTION_INTENT_FRIENDSHIP = 'Friendship' as const;

/** @deprecated Dating intents removed — use INTEREST_OPTIONS */
export const LOOKING_FOR_OPTIONS = INTEREST_OPTIONS;
/** @deprecated Use InterestId */
export type LookingForId = InterestId;

export type GenderValue = 'Male' | 'Female';

export const TEMPERAMENT_OPTIONS = ['Happy', 'Calm', 'Playful', 'Energetic', 'Shy', 'Friendly'] as const;
export type TemperamentValue = (typeof TEMPERAMENT_OPTIONS)[number];

export type VaccinatedValue = 'Yes' | 'No';

/** Australian English: desexed (neutered/spayed). */
export type DesexedValue = 'Yes' | 'No';

export type ProfileDraft = {
  interests: InterestId[];
  humanPhotoUri: string | null;
  fullName: string;
  email: string;
  phone: string;
  age: string;
  humanGender: GenderValue | '';
  location: string;
  humanBio: string;
  handle: string;
  dogPhotoUri: string | null;
  dogName: string;
  /** Pet birthday as YYYY-MM-DD (preferred). Legacy dogAge kept for migration. */
  dogBirthday: string;
  /** @deprecated Prefer dogBirthday — kept for draft migration / filters */
  dogAge: string;
  breed: string;
  dogBio: string;
  temperament: TemperamentValue[];
  vaccinated: VaccinatedValue | '';
  desexed: DesexedValue | '';
  dogGender: GenderValue | '';
  favoritesThings: string;
  favoriteMeal: string;
  dogEnjoysPark: boolean;
  dogEnjoysWater: boolean;
  dogEnjoysWalks: boolean;
  /** UI gate for free-text favorites; shown when user selects Others. */
  dogEnjoysOthers: boolean;
};

const INTEREST_SET = new Set<string>(INTEREST_OPTIONS);
const INTEREST_ALL: InterestId = 'All the above';
const INTEREST_INDIVIDUAL = INTEREST_OPTIONS.filter((o) => o !== INTEREST_ALL);

function normalizeInterests(raw: unknown): InterestId[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is InterestId => typeof v === 'string' && INTEREST_SET.has(v));
}

/** Migrate drafts that still store lookingFor dating intents. */
function interestsFromLegacyDraft(parsed: Record<string, unknown>): InterestId[] {
  const fromInterests = normalizeInterests(parsed.interests);
  if (fromInterests.length) return fromInterests;
  const lookingFor = Array.isArray(parsed.lookingFor) ? parsed.lookingFor : [];
  const mapped: InterestId[] = [];
  for (const item of lookingFor) {
    if (typeof item !== 'string') continue;
    if (INTEREST_SET.has(item)) mapped.push(item as InterestId);
    else if (item === 'Friendship' || item === 'Meet people') mapped.push('Friendship');
  }
  return [...new Set(mapped)];
}

function normalizeGenderOptional(raw: unknown): GenderValue | '' {
  const g = typeof raw === 'string' ? raw.trim() : '';
  if (!g) return '';
  if (g === 'Male' || g === 'male' || g === 'M' || g === 'Homem') return 'Male';
  if (g === 'Female' || g === 'female' || g === 'F' || g === 'Mulher') return 'Female';
  return '';
}

function normalizeGenderForApi(raw: GenderValue | ''): GenderValue {
  return raw === 'Female' ? 'Female' : 'Male';
}

function normalizeTemperamentList(raw: unknown): TemperamentValue[] {
  const list = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  const out: TemperamentValue[] = [];
  for (const item of list) {
    const s = typeof item === 'string' ? item.trim() : '';
    if (!s) continue;
    const found = TEMPERAMENT_OPTIONS.find((o) => o.toLowerCase() === s.toLowerCase());
    if (found && !out.includes(found)) out.push(found);
  }
  return out;
}

function normalizeTemperamentForApi(raw: TemperamentValue[]): TemperamentValue[] {
  return raw.length ? raw : [];
}

function normalizeVaccinatedOptional(raw: unknown): VaccinatedValue | '' {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!s) return '';
  if (s === 'no' || s === 'n' || s === 'false' || s === 'não' || s === 'nao') return 'No';
  if (s === 'yes' || s === 'y' || s === 'true' || s === 'sim') return 'Yes';
  return '';
}

function normalizeVaccinatedForApi(raw: VaccinatedValue | ''): VaccinatedValue {
  return raw === 'No' ? 'No' : 'Yes';
}

function normalizeDesexedOptional(raw: unknown): DesexedValue | '' {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!s) return '';
  if (s === 'no' || s === 'n' || s === 'false' || s === 'não' || s === 'nao') return 'No';
  if (s === 'yes' || s === 'y' || s === 'true' || s === 'sim') return 'Yes';
  return '';
}

function normalizeDesexedForApi(raw: DesexedValue | ''): DesexedValue {
  return raw === 'Yes' ? 'Yes' : 'No';
}

async function resolvePhotoUrlForApi(
  photoUri: string | null | undefined,
  throwOnError: boolean,
): Promise<string | undefined> {
  if (!photoUri) return undefined;
  try {
    const uploaded = await resolveRemoteUri(photoUri);
    if (isHttpUrl(uploaded)) return uploaded;
    if (throwOnError) {
      throw new Error('Could not upload profile photo.');
    }
    return undefined;
  } catch (err) {
    if (throwOnError) throw err;
    return undefined;
  }
}

type SyncOwnerOptions = {
  humanPhotoUri?: string | null;
  throwOnPhotoUploadError?: boolean;
};

type SyncPetOptions = {
  dogPhotoUri?: string | null;
  throwOnPhotoUploadError?: boolean;
};

const emptyDraft = (): ProfileDraft => ({
  interests: [],
  humanPhotoUri: null,
  fullName: '',
  email: '',
  phone: '',
  age: '',
  humanGender: '',
  location: '',
  humanBio: '',
  handle: '',
  dogPhotoUri: null,
  dogName: '',
  dogBirthday: '',
  dogAge: '',
  breed: '',
  dogBio: '',
  temperament: [],
  vaccinated: '',
  desexed: '',
  dogGender: '',
  favoritesThings: '',
  favoriteMeal: '',
  dogEnjoysPark: false,
  dogEnjoysWater: false,
  dogEnjoysWalks: false,
  dogEnjoysOthers: false,
});

type ProfileOnboardingContextValue = {
  hydrated: boolean;
  onboardingComplete: boolean;
  draft: ProfileDraft;
  handle: string | null;
  setDraft: (patch: Partial<ProfileDraft>) => void;
  setDraftPhoto: (field: 'dogPhotoUri' | 'humanPhotoUri', uri: string) => void;
  toggleInterest: (id: InterestId) => void;
  /** @deprecated Use toggleInterest */
  toggleLookingFor: (id: InterestId) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboardingForDev: () => Promise<void>;
  clearLocalProfile: () => Promise<void>;
  syncInterestsToApi: () => Promise<void>;
  /** @deprecated Use syncInterestsToApi */
  syncLookingForToApi: () => Promise<void>;
  registerAndSyncOwner: (password: string) => Promise<void>;
  syncPetToApi: (options?: SyncPetOptions) => Promise<ProfileMeResponse | undefined>;
  syncOwnerToApi: (options?: SyncOwnerOptions) => Promise<ProfileMeResponse | undefined>;
  syncPhotoToApi: (field: 'dog' | 'human', uri: string) => Promise<ProfileMeResponse | undefined>;
  refreshFromApi: () => Promise<void>;
};

const ProfileOnboardingContext = createContext<ProfileOnboardingContextValue | null>(null);

export function ProfileOnboardingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, register: registerAuth, hydrated: authHydrated } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [draft, setDraftState] = useState<ProfileDraft>(emptyDraft);
  const [handle, setHandle] = useState<string | null>(null);

  const applyProfileResponse = useCallback((dto: Awaited<ReturnType<typeof profileApi.getMyProfile>>) => {
    setDraftState((prev) => profileMeToDraft(dto, prev));
    setOnboardingComplete(dto.onboardingComplete);
    setHandle(dto.handle);
    void safeSetItem(STORAGE_DONE, dto.onboardingComplete ? 'true' : 'false');
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const [doneRaw, draftRaw] = await Promise.all([
          safeGetItem(STORAGE_DONE),
          safeGetItem(STORAGE_DRAFT),
        ]);
        if (cancelled) return;

        if (draftRaw && !isAuthenticated) {
          const parsed = JSON.parse(draftRaw) as Record<string, unknown>;
          setDraftState({
            ...emptyDraft(),
            interests: interestsFromLegacyDraft(parsed),
          });
        } else if (draftRaw && isAuthenticated) {
          const parsed = JSON.parse(draftRaw) as Partial<ProfileDraft> & {
            lookingFor?: unknown;
            dogFavoriteMealBeef?: boolean;
            dogFavoriteMealChicken?: boolean;
            dogFavoriteMealFish?: boolean;
          };
          const {
            dogFavoriteMealBeef: _b,
            dogFavoriteMealChicken: _c,
            dogFavoriteMealFish: _f,
            lookingFor: _lf,
            ...rest
          } = parsed;
          const merged = { ...emptyDraft(), ...rest } as ProfileDraft;
          merged.interests = interestsFromLegacyDraft(parsed as Record<string, unknown>);
          merged.humanGender = normalizeGenderOptional(merged.humanGender);
          merged.dogGender = normalizeGenderOptional(merged.dogGender);
          merged.temperament = normalizeTemperamentList(merged.temperament);
          merged.vaccinated = normalizeVaccinatedOptional(merged.vaccinated);
          merged.desexed = normalizeDesexedOptional(merged.desexed);
          if (typeof merged.favoriteMeal !== 'string') merged.favoriteMeal = '';
          if (typeof merged.dogBirthday !== 'string') merged.dogBirthday = '';
          if (typeof merged.dogEnjoysOthers !== 'boolean') {
            merged.dogEnjoysOthers = Boolean(merged.favoritesThings?.trim());
          } else if (merged.favoritesThings?.trim()) {
            merged.dogEnjoysOthers = true;
          }
          setDraftState(merged);
        }

        if (isAuthenticated) {
          const profile = await withTimeout(
            profileApi.getMyProfile(),
            10_000,
            'Profile bootstrap',
          );
          if (cancelled) return;
          applyProfileResponse(profile);
        } else {
          setOnboardingComplete(doneRaw === 'true');
        }
      } catch {
        if (!cancelled) setOnboardingComplete((await safeGetItem(STORAGE_DONE)) === 'true');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, isAuthenticated, applyProfileResponse]);

  useEffect(() => {
    if (!authHydrated || isAuthenticated) return;
    setDraftState(emptyDraft());
    setHandle(null);
  }, [authHydrated, isAuthenticated]);

  const persistDraft = useCallback(async (next: ProfileDraft) => {
    await safeSetItem(STORAGE_DRAFT, JSON.stringify(next));
  }, []);

  const setDraft = useCallback(
    (patch: Partial<ProfileDraft>) => {
      setDraftState((prev) => {
        const next = { ...prev, ...patch };
        void persistDraft(next);
        return next;
      });
    },
    [persistDraft],
  );

  const setDraftPhoto = useCallback(
    (field: 'dogPhotoUri' | 'humanPhotoUri', uri: string) => {
      setDraftState((prev) => {
        const next = { ...prev, [field]: uri };
        queueMicrotask(() => {
          void persistDraft(next);
        });
        return next;
      });
    },
    [persistDraft],
  );

  const toggleInterest = useCallback(
    (id: InterestId) => {
      setDraftState((prev) => {
        let interests: InterestId[];

        if (id === INTEREST_ALL) {
          const allSelected = INTEREST_OPTIONS.every((o) => prev.interests.includes(o));
          interests = allSelected ? [] : [...INTEREST_OPTIONS];
        } else {
          const has = prev.interests.includes(id);
          const withoutAll = prev.interests.filter((value) => value !== INTEREST_ALL);
          const nextIndividuals = has
            ? withoutAll.filter((value) => value !== id)
            : [...withoutAll, id];
          const everyIndividual = INTEREST_INDIVIDUAL.every((o) =>
            nextIndividuals.includes(o),
          );
          interests = everyIndividual ? [...INTEREST_OPTIONS] : nextIndividuals;
        }

        const next = { ...prev, interests };
        void persistDraft(next);
        return next;
      });
    },
    [persistDraft],
  );

  const refreshFromApi = useCallback(async () => {
    if (!isAuthenticated) return;
    const profile = await profileApi.getMyProfile();
    applyProfileResponse(profile);
    await persistDraft(profileMeToDraft(profile, draft));
  }, [isAuthenticated, applyProfileResponse, persistDraft, draft]);

  const syncInterestsToApi = useCallback(async () => {
    if (!isAuthenticated) return;
    const profile = await profileApi.updateInterests(draft.interests);
    if (profile) applyProfileResponse(profile);
  }, [isAuthenticated, draft.interests, applyProfileResponse]);

  const registerAndSyncOwner = useCallback(
    async (password: string) => {
      const email = draft.email.trim();
      const fullName = draft.fullName.trim();
      const handle = draft.handle.trim();
      if (!email || !fullName || password.length < 6) {
        throw new Error('Email, name and password (min 6 chars) are required.');
      }
      if (!isValidHandle(handle)) {
        throw new Error('Choose an @ handle with 3–20 letters, numbers, or underscores.');
      }

      if (!isAuthenticated) {
        await registerAuth(email, password, fullName, handle);
      }

      let humanPhotoUrl: string | undefined;
      if (draft.humanPhotoUri) {
        try {
          const uploaded = await resolveRemoteUri(draft.humanPhotoUri);
          if (isHttpUrl(uploaded)) humanPhotoUrl = uploaded;
        } catch {
          /* photo is optional — do not block account creation */
        }
      }

      const age = draft.age.trim() ? Number.parseInt(draft.age, 10) : undefined;

      const profile = await profileApi.updateOwner({
        fullName,
        email,
        phone: draft.phone.trim() || undefined,
        age: Number.isFinite(age) ? age : undefined,
        gender: normalizeGenderForApi(draft.humanGender),
        location: draft.location.trim() || undefined,
        bio: draft.humanBio.trim() || undefined,
        photoUrl: humanPhotoUrl,
        handle,
      });

      const withInterests = await profileApi.updateInterests(draft.interests);
      applyProfileResponse(withInterests ?? profile);
      if (humanPhotoUrl) setDraft({ humanPhotoUri: humanPhotoUrl });
    },
    [draft, isAuthenticated, registerAuth, applyProfileResponse, setDraft],
  );

  const syncOwnerToApi = useCallback(
    async (options?: SyncOwnerOptions): Promise<ProfileMeResponse | undefined> => {
      if (!isAuthenticated) return undefined;
      const humanPhotoUri =
        options?.humanPhotoUri !== undefined ? options.humanPhotoUri : draft.humanPhotoUri;
      const throwOnPhotoUploadError = options?.throwOnPhotoUploadError ?? false;
      const humanPhotoUrl = await resolvePhotoUrlForApi(humanPhotoUri, throwOnPhotoUploadError);
      const age = draft.age.trim() ? Number.parseInt(draft.age, 10) : undefined;
      const profile = await profileApi.updateOwner({
        fullName: draft.fullName.trim() || undefined,
        email: draft.email.trim() || undefined,
        phone: draft.phone.trim() || undefined,
        age: Number.isFinite(age) ? age : undefined,
        ...(draft.humanGender ? { gender: draft.humanGender } : {}),
        location: draft.location.trim() || undefined,
        bio: draft.humanBio.trim() || undefined,
        photoUrl: humanPhotoUrl,
        ...(draft.handle.trim() ? { handle: draft.handle.trim() } : {}),
      });
      applyProfileResponse(profile);
      if (humanPhotoUrl) {
        setDraft({ humanPhotoUri: humanPhotoUrl });
      }
      return profile;
    },
    [isAuthenticated, draft, applyProfileResponse, setDraft],
  );

  const syncPetToApi = useCallback(
    async (options?: SyncPetOptions): Promise<ProfileMeResponse | undefined> => {
      if (!isAuthenticated) return undefined;
      const dogPhotoUri =
        options?.dogPhotoUri !== undefined ? options.dogPhotoUri : draft.dogPhotoUri;
      const throwOnPhotoUploadError = options?.throwOnPhotoUploadError ?? false;
      const dogPhotoUrl = await resolvePhotoUrlForApi(dogPhotoUri, throwOnPhotoUploadError);
      const birthday = draft.dogBirthday.trim() || undefined;
      const ageFromBirthday = ageFromBirthdayIso(birthday);
      const legacyAge = draft.dogAge.trim() ? Number.parseInt(draft.dogAge, 10) : undefined;
      const age = ageFromBirthday ?? (Number.isFinite(legacyAge) ? legacyAge : undefined);
      const profile = await profileApi.updatePet({
        name: draft.dogName.trim() || undefined,
        birthDate: birthday,
        age,
        breed: draft.breed.trim() || undefined,
        bio: draft.dogBio.trim() || undefined,
        photoUrl: dogPhotoUrl,
        temperament: normalizeTemperamentForApi(draft.temperament),
        vaccinated: normalizeVaccinatedForApi(draft.vaccinated),
        desexed: normalizeDesexedForApi(draft.desexed),
        gender: normalizeGenderForApi(draft.dogGender),
        favoritesThings: draft.dogEnjoysOthers
          ? draft.favoritesThings.trim() || undefined
          : '',
        favoriteMeal: draft.favoriteMeal.trim() || undefined,
        enjoysPark: draft.dogEnjoysPark,
        enjoysWater: draft.dogEnjoysWater,
        enjoysWalks: draft.dogEnjoysWalks,
      });
      applyProfileResponse(profile);
      if (dogPhotoUrl) {
        setDraft({ dogPhotoUri: dogPhotoUrl });
      }
      return profile;
    },
    [isAuthenticated, draft, applyProfileResponse, setDraft],
  );

  const syncPhotoToApi = useCallback(
    async (field: 'dog' | 'human', uri: string): Promise<ProfileMeResponse | undefined> => {
      if (field === 'dog') {
        return syncPetToApi({ dogPhotoUri: uri, throwOnPhotoUploadError: true });
      }
      return syncOwnerToApi({ humanPhotoUri: uri, throwOnPhotoUploadError: true });
    },
    [syncOwnerToApi, syncPetToApi],
  );

  const completeOnboarding = useCallback(async () => {
    if (isAuthenticated) {
      const profile = await profileApi.completeOnboardingRemote();
      applyProfileResponse(profile);
    } else {
      setOnboardingComplete(true);
      await safeSetItem(STORAGE_DONE, 'true');
    }
  }, [isAuthenticated, applyProfileResponse]);

  const resetOnboardingForDev = useCallback(async () => {
    setOnboardingComplete(false);
    setDraftState(emptyDraft());
    setHandle(null);
    await Promise.all([safeRemoveItem(STORAGE_DONE), safeRemoveItem(STORAGE_DRAFT)]);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      onboardingComplete,
      draft,
      handle,
      setDraft,
      setDraftPhoto,
      toggleInterest,
      toggleLookingFor: toggleInterest,
      completeOnboarding,
      resetOnboardingForDev,
      clearLocalProfile: resetOnboardingForDev,
      syncInterestsToApi,
      syncLookingForToApi: syncInterestsToApi,
      registerAndSyncOwner,
      syncPetToApi,
      syncOwnerToApi,
      syncPhotoToApi,
      refreshFromApi,
    }),
    [
      hydrated,
      onboardingComplete,
      draft,
      handle,
      setDraft,
      setDraftPhoto,
      toggleInterest,
      completeOnboarding,
      resetOnboardingForDev,
      syncInterestsToApi,
      registerAndSyncOwner,
      syncPetToApi,
      syncOwnerToApi,
      syncPhotoToApi,
      refreshFromApi,
    ],
  );

  return <ProfileOnboardingContext.Provider value={value}>{children}</ProfileOnboardingContext.Provider>;
}

export function useProfileOnboarding() {
  const ctx = useContext(ProfileOnboardingContext);
  if (!ctx) {
    throw new Error('useProfileOnboarding must be used within ProfileOnboardingProvider');
  }
  return ctx;
}

export function publicHandleFromDraft(draft: ProfileDraft): string {
  const value = draft.handle.trim().replace(/^@+/, '');
  return value ? `@${value}` : '';
}
