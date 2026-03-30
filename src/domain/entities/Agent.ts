export class Agent {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
      public readonly isEnabled: boolean = true,
    public readonly createdAt?: Date
  ) {}
}