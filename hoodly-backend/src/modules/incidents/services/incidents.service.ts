import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incident, IncidentDocument } from '../schemas/incident.schema';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentStatutDto } from '../dto/update-incident-statut.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async findAll(zoneId?: string): Promise<Incident[]> {
    const filter = zoneId ? { zoneId: new Types.ObjectId(zoneId) } : {};
    return this.incidentModel.find(filter).lean().exec() as unknown as Incident[];
  }

  async create(data: CreateIncidentDto): Promise<Incident> {
    const incident = new this.incidentModel(data);
    return incident.save();
  }

  async updateStatut(id: string, dto: UpdateIncidentStatutDto): Promise<Incident> {
    const updated = await this.incidentModel
      .findByIdAndUpdate(id, { statut: dto.statut }, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException(`Incident ${id} introuvable`);
    return updated as unknown as Incident;
  }
}
