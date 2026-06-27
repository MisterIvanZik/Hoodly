import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { Vote, VoteSchema } from './schemas/vote.schema';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { VotesGateway } from './votes.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vote.name, schema: VoteSchema }]),
    UsersModule,
    PostsModule,
  ],
  controllers: [VotesController],
  providers: [VotesService, VotesGateway],
  exports: [VotesService, VotesGateway],
})
export class VotesModule {}
