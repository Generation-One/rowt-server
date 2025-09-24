import { WellKnownEntity } from './well-known.entity';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';

export abstract class WellKnownRepositoryPort {
  abstract create(userId: string, createDto: CreateWellKnownDTO): Promise<WellKnownEntity>;
  abstract findAll(userId: string): Promise<WellKnownEntity[]>;
  abstract findById(id: string, userId: string): Promise<WellKnownEntity | null>;
  abstract findByFilename(filename: string): Promise<WellKnownEntity | null>;
  abstract update(id: string, userId: string, updateDto: UpdateWellKnownDTO): Promise<WellKnownEntity>;
  abstract delete(id: string, userId: string): Promise<void>;
  abstract findEnabledByFilename(filename: string): Promise<WellKnownEntity | null>;
}
