export class Agent {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly apiKey: string,
    public readonly isActive: boolean,
    public readonly isEnabled: boolean = true,
    public readonly isDeleted: boolean = false,
    public readonly createdAt?: Date,

  ) {}

    // Business Rule: Check if agent can perform operations
   canPerformTransaction(): boolean {
        return this.isActive && this.apiKey !== null;

}
};