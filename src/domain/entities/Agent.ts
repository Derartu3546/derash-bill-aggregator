export class Agent {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly code: string,
        public readonly api_key: string | null,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    // Business Rule: Check if agent can perform operations
   canPerformTransaction(): boolean {
        return this.isActive && this.api_key !== null;
   }
}