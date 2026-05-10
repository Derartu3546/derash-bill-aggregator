export class Agent {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly isEnabled: boolean = true,
      public readonly isDeleted: boolean = false,
    public readonly createdAt?: Date
  ) {}
}