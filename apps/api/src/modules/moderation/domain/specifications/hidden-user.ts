import { CompositeSpecification } from '../../../../shared/domain/specification';

/** True when the candidate id is not in the viewer's hidden (blocked) set. */
export class VisibleToViewerSpec extends CompositeSpecification<{ id: string }> {
  constructor(private readonly hiddenUserIds: ReadonlySet<string>) {
    super();
  }

  isSatisfiedBy(candidate: { id: string }): boolean {
    return !this.hiddenUserIds.has(candidate.id);
  }
}

export class VisibleAuthorSpec extends CompositeSpecification<{ authorId: string }> {
  constructor(private readonly hiddenUserIds: ReadonlySet<string>) {
    super();
  }

  isSatisfiedBy(candidate: { authorId: string }): boolean {
    return !this.hiddenUserIds.has(candidate.authorId);
  }
}

export class PartiesNotBlockedSpec extends CompositeSpecification<{
  senderId: string;
  recipientId: string;
}> {
  constructor(private readonly hiddenUserIds: ReadonlySet<string>) {
    super();
  }

  isSatisfiedBy(candidate: { senderId: string; recipientId: string }): boolean {
    return (
      !this.hiddenUserIds.has(candidate.senderId) &&
      !this.hiddenUserIds.has(candidate.recipientId)
    );
  }
}
