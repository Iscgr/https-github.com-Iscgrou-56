import { BaseRepository } from './base';

export class UsageRepository extends BaseRepository {
  async isProcessed(hash: string) {
    const existing = await this.db.processedUsageHash.findUnique({
      where: { hash },
    });
    return Boolean(existing);
  }

  async markProcessed(hash: string) {
    await this.db.processedUsageHash.create({
      data: {
        hash,
      },
    });
  }

  async markProcessedMany(hashes: string[]) {
    if (!hashes.length) return;
    await this.db.processedUsageHash.createMany({
      data: hashes.map((hash) => ({ hash })),
      skipDuplicates: true,
    });
  }

  async findExisting(hashes: string[]) {
    if (!hashes.length) return new Set<string>();
    const existing = await this.db.processedUsageHash.findMany({
      where: { hash: { in: hashes } },
      select: { hash: true },
    });
    return new Set(existing.map((item) => item.hash));
  }

  async pruneOlderThan(date: Date) {
    await this.db.processedUsageHash.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  }
}
