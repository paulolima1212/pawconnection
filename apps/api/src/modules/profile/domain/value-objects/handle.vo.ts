export class Handle {
  private constructor(readonly value: string) {}

  static fromFullName(fullName: string): Handle {
    const base =
      fullName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '') || 'walkingphoebe';
    return new Handle(base);
  }

  static fromString(value: string): Handle {
    const normalized = value.replace(/^@/, '').trim().toLowerCase();
    return new Handle(normalized || 'walkingphoebe');
  }
}
