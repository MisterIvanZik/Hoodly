import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Event, EventDocument } from '../events/schemas/event.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly neo4j: Neo4jService,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
  ) {}

  async getEventRecommendations(userId: string) {
    const recommendedIds = await this.neo4j.getEventRecommendations(userId);

    if (recommendedIds.length === 0) return [];

    const events = await this.eventModel
      .find({ _id: { $in: recommendedIds } })
      .populate('participants', 'name picture')
      .lean();

    // Respecter l'ordre de score retourné par Neo4j
    return recommendedIds
      .map((id) => events.find((e) => (e._id as any).toString() === id))
      .filter(Boolean);
  }
}
