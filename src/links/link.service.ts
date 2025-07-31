import { Injectable, Inject } from '@nestjs/common';
import { LinkRepositoryPort } from './link.repository.port';
import { CreateLinkDTO } from './dto/createLink.dto';
import { UpdateLinkDTO } from './dto/updateLink.dto';
import { Link } from './link.model';
import { LinkEntity } from './link.entity';

@Injectable()
export class LinkService {
  constructor(
    @Inject('LinkRepositoryPort')
    private readonly linkRepository: LinkRepositoryPort,
  ) {}

  async createLink(createLinkDto: CreateLinkDTO): Promise<string> {
    // Transform DTO into Link domain model
    const link: Link = {
      projectId: createLinkDto.projectId,
      url: createLinkDto.url,
      title: createLinkDto.title,
      description: createLinkDto.description,
      imageUrl: createLinkDto.imageUrl,
      fallbackUrlOverride: createLinkDto.fallbackUrlOverride,
      additionalMetadata: createLinkDto.additionalMetadata,
      properties: createLinkDto.properties,
    };

    // Pass the Link to the repository
    const savedEntity = await this.linkRepository.createLink(link);

    // Return the short URL (example logic)
    return savedEntity;
  }

  async getLinksByProjectId(
    projectId: string,
    includeInteractions: boolean,
  ): Promise<LinkEntity[]> {
    return this.linkRepository.getLinksByProjectId(
      projectId,
      includeInteractions,
    );
  }

  async findLinkById(linkId: string): Promise<LinkEntity | null> {
    return this.linkRepository.findLinkById(linkId);
  }

  async updateLink(linkId: string, updateLinkDto: UpdateLinkDTO): Promise<LinkEntity> {
    // Transform DTO into partial Link domain model
    const updateData: Partial<Link> = {
      ...(updateLinkDto.url && { url: updateLinkDto.url }),
      ...(updateLinkDto.title !== undefined && { title: updateLinkDto.title }),
      ...(updateLinkDto.description !== undefined && { description: updateLinkDto.description }),
      ...(updateLinkDto.imageUrl !== undefined && { imageUrl: updateLinkDto.imageUrl }),
      ...(updateLinkDto.fallbackUrlOverride !== undefined && { fallbackUrlOverride: updateLinkDto.fallbackUrlOverride }),
      ...(updateLinkDto.additionalMetadata !== undefined && { additionalMetadata: updateLinkDto.additionalMetadata }),
      ...(updateLinkDto.properties !== undefined && { properties: updateLinkDto.properties }),
    };

    // Pass the update data to the repository
    return this.linkRepository.updateLink(linkId, updateData);
  }
}
