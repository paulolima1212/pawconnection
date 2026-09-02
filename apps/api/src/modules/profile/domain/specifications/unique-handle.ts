import { CompositeSpecification } from '../../../../shared/domain/specification';
import { UserEntity } from '../../../../shared/domain/types';

export class UniqueHandleSpec extends CompositeSpecification<UserEntity | null> {
  constructor(private readonly handle: string) {
    super();
  }

  isSatisfiedBy(candidate: UserEntity | null): boolean {
    return candidate === null;
  }

  getHandle(): string {
    return this.handle;
  }
}
