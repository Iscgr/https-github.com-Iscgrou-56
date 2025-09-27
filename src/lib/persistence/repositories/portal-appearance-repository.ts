import { BaseRepository } from './base';

export class PortalAppearanceRepository extends BaseRepository {
  async findByAgentId(agentId: string) {
    return this.db.portalAppearance.findUnique({
      where: { agentId },
    });
  }
}
