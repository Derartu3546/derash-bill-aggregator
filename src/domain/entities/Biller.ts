export class Biller {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly category: string,
    public readonly allowsPartial: boolean = false,
    public readonly apiEndPoint?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt?: Date
  ) {}
}