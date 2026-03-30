export class CreateAuditLogUseCase {
  constructor(private auditRepo: any) {}

  async execute(logData: any) {
    return await this.auditRepo.createLog(logData);
  }
}
