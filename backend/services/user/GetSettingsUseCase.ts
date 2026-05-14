import { IUserRepository } from "../../models/IUserRepository";

export class GetSettingUseCase {
    constructor(
        private userRepository: IUserRepository
    )
    { }
    
    async execute(userId: string) {
        const settings = await this.userRepository.getUserSettings(userId);

        // if no settings exis yet , return a clean default object 
        if (!settings) {
            return {
              theme: "system",
              language: "en",
              emailNotifications: true,
              smsNotifications: false,
              twoFactorEnabled: false,
              loginAlerts: true
            };
        }
        return settings;
    }
}