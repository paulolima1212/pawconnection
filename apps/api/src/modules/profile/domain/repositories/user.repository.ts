import { UserEntity } from '../../../../shared/domain/types';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  handle: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByHandle(handle: string): Promise<UserEntity | null>;
  create(input: CreateUserInput): Promise<UserEntity>;
  updateOwner(
    userId: string,
    data: Partial<
      Pick<
        UserEntity,
        | 'fullName'
        | 'email'
        | 'phone'
        | 'age'
        | 'gender'
        | 'location'
        | 'latitude'
        | 'longitude'
        | 'bio'
        | 'photoUrl'
        | 'handle'
      >
    >,
  ): Promise<UserEntity>;
  setInterests(userId: string, interests: string[]): Promise<UserEntity>;
  setLookingFor(userId: string, lookingFor: string[]): Promise<UserEntity>;
  completeOnboarding(userId: string): Promise<UserEntity>;
  listCandidates(
    userId: string,
    options?: { excludeIds?: string[] },
  ): Promise<UserEntity[]>;
}
