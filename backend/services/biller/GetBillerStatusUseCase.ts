

export class GetBillerStatsUseCase {
  constructor(private billerRepo: any) {}

  async execute(billerId: string, currentUser: any) {
    if (
      currentUser.role !== "SYSTEM_ADMIN" &&
      currentUser.billerId !== billerId
    ) {
      throw new Error(
        "Unauthorized: You cannot acccess these financial insights",
      );
    }

    return await this.billerRepo.getBillerStats(billerId);
  }
}
