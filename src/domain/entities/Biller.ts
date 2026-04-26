export class Biller {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly category: string,
    public readonly allows_partial: boolean = false,
    public readonly charges_late_fee: boolean = true,
    public readonly grace_period: number = 0,
    public readonly account_no?: string,
    public readonly apiEndPoint?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt?: Date
  ) {}
}