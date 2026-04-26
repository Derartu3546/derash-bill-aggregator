import { Agent } from '../entities/Agent.ts';

export interface IAgentRepository {
    // Basic Lookups
    findById(id: string): Promise<Agent | null>;
    findByCode(code: string): Promise<Agent | null>;
    findByApiKey(api_key: string): Promise<Agent | null>;
    create(agentData: any): Promise<Agent>;
    count(): Promise<number>;

    updateStatus(id: string, isActive: boolean, tx?: any): Promise<Agent>;

    findAllActive(): Promise<Agent[]>;
}