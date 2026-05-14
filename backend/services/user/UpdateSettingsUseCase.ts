import { IUserRepository } from "../../models/IUserRepository";
import { PrismaAuditRepository } from "../../models/PrismaAuditRepository";
import { AuditService } from "../AuditService";

export class UpdateSettingsUseCase {
    constructor(private userRepository: IUserRepository,
        private auditRepository: PrismaAuditRepository
    ) { }
    
    async execute(userId: string, settingData: any, meta: { ip: string; email: string;  userAgent?: string}) {
        const oldSettings = await this.userRepository.getUserSettings(userId);
        const updated = await this.userRepository.updateUserSettings(userId, settingData);

        await AuditService.log({
          userId,
          userEmail: meta.email,
          action: "UPDATE_SETTINGS",
          entity: "UserSettings",
          entityId: updated.id,
          oldData: oldSettings ? JSON.parse(JSON.stringify(oldSettings)): null,
          newData: settingData,
          ip: meta.ip,
        });
        return updated;
    }
}