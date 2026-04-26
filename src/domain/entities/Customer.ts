export class Customer {
    constructor(
        public readonly id: string,
        public readonly full_name: string,
        public readonly phone_no: string,
        public readonly email: string | null,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    // Business Rule: Validate Ethiopian Phone Number (optional helper)
    isValidPhone(): boolean {
        return this.phone_no.startsWith("+251") || this.phone_no.startsWith("09");
    }
}