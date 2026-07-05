import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
