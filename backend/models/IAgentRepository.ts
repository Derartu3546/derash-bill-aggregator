import { Agent } from "./Agent";


export interface IAgentRepository {
    findById(id: string): Promise<Agent | null>;
    findByCode(code: string): Promise<Agent | null>;
     findByApiKey(apiKey: string): Promise<Agent | null>;
    create(agent: Agent): Promise<Agent>;
    update(agent: Agent): Promise<Agent>;
    delete(id: string): Promise<void>;
    findAll(params: {
        search?: string;
        page: number;
        limit: number;
    }): Promise<Agent[]>;
}