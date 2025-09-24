import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WellKnownEntity } from './well-known.entity';
import { WellKnownRepositoryPort } from './well-known.repository.port';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';

@Injectable()
export class WellKnownRepositoryAdapter implements WellKnownRepositoryPort {
  constructor(
    @InjectRepository(WellKnownEntity)
    private readonly wellKnownRepository: Repository<WellKnownEntity>,
  ) {}

  async create(userId: string, createDto: CreateWellKnownDTO): Promise<WellKnownEntity> {
    // Check if filename already exists
    const existingFile = await this.wellKnownRepository.findOne({
      where: { filename: createDto.filename },
    });

    if (existingFile) {
      throw new ConflictException(`Well-known file '${createDto.filename}' already exists`);
    }

    const wellKnownFile = this.wellKnownRepository.create({
      ...createDto,
      userId,
    });

    return await this.wellKnownRepository.save(wellKnownFile);
  }

  async findAll(userId: string): Promise<WellKnownEntity[]> {
    return await this.wellKnownRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<WellKnownEntity | null> {
    return await this.wellKnownRepository.findOne({
      where: { id, userId },
    });
  }

  async findByFilename(filename: string): Promise<WellKnownEntity | null> {
    return await this.wellKnownRepository.findOne({
      where: { filename },
    });
  }

  async findEnabledByFilename(filename: string): Promise<WellKnownEntity | null> {
    return await this.wellKnownRepository.findOne({
      where: { filename, enabled: true },
    });
  }

  async update(id: string, userId: string, updateDto: UpdateWellKnownDTO): Promise<WellKnownEntity> {
    const wellKnownFile = await this.findById(id, userId);
    if (!wellKnownFile) {
      throw new NotFoundException('Well-known file not found');
    }

    Object.assign(wellKnownFile, updateDto);
    return await this.wellKnownRepository.save(wellKnownFile);
  }

  async delete(id: string, userId: string): Promise<void> {
    const wellKnownFile = await this.findById(id, userId);
    if (!wellKnownFile) {
      throw new NotFoundException('Well-known file not found');
    }

    await this.wellKnownRepository.remove(wellKnownFile);
  }
}
