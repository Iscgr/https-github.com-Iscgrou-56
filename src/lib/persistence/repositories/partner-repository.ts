import { BaseRepository } from './base';

export class PartnerRepository extends BaseRepository {
  async listPartners() {
    return this.db.partner.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.db.partner.findUnique({
      where: { id },
    });
  }
}
