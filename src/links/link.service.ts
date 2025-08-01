import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { LinkRepositoryPort } from './link.repository.port';
import { CreateLinkDTO } from './dto/createLink.dto';
import { UpdateLinkDTO } from './dto/updateLink.dto';
import { Link } from './link.model';
import { LinkEntity } from './link.entity';
import { isParameterizedUrl } from '../utils/parameterSubstitution';

@Injectable()
export class LinkService {
  constructor(
    @Inject('LinkRepositoryPort')
    private readonly linkRepository: LinkRepositoryPort,
  ) {}

  async createLink(createLinkDto: CreateLinkDTO): Promise<string> {
    // Validate custom shortcode if provided
    if (createLinkDto.customShortcode) {
      // Check if shortcode already exists
      const existingLink = await this.linkRepository.findLinkById(createLinkDto.customShortcode);

      if (existingLink) {
        throw new BadRequestException('Custom shortcode already exists. Please choose a different one.');
      }

      // Additional validation for reserved words/patterns
      const reservedWords = ['api', 'admin', 'www', 'link', 'health', 'static'];
      if (reservedWords.includes(createLinkDto.customShortcode.toLowerCase())) {
        throw new BadRequestException('Custom shortcode uses a reserved word. Please choose a different one.');
      }
    }

    // Auto-detect if URL is parameterized if not explicitly set
    const isParameterized = createLinkDto.isParameterized ?? isParameterizedUrl(createLinkDto.url);

    // Transform DTO into Link domain model
    const link: Link = new Link(
      createLinkDto.projectId,
      createLinkDto.url,
      createLinkDto.customShortcode, // Pass custom shortcode
      createLinkDto.title,
      createLinkDto.description,
      createLinkDto.imageUrl,
      createLinkDto.fallbackUrlOverride,
      createLinkDto.additionalMetadata,
      createLinkDto.properties,
      undefined, // lifetimeClicks
      isParameterized,
    );

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
    // Auto-detect if URL is parameterized if URL is being updated
    let isParameterized = updateLinkDto.isParameterized;
    if (updateLinkDto.url && isParameterized === undefined) {
      isParameterized = isParameterizedUrl(updateLinkDto.url);
    }

    // Transform DTO into partial Link domain model
    const updateData: Partial<Link> = {
      ...(updateLinkDto.url && { url: updateLinkDto.url }),
      ...(updateLinkDto.title !== undefined && { title: updateLinkDto.title }),
      ...(updateLinkDto.description !== undefined && { description: updateLinkDto.description }),
      ...(updateLinkDto.imageUrl !== undefined && { imageUrl: updateLinkDto.imageUrl }),
      ...(updateLinkDto.fallbackUrlOverride !== undefined && { fallbackUrlOverride: updateLinkDto.fallbackUrlOverride }),
      ...(updateLinkDto.additionalMetadata !== undefined && { additionalMetadata: updateLinkDto.additionalMetadata }),
      ...(updateLinkDto.properties !== undefined && { properties: updateLinkDto.properties }),
      ...(isParameterized !== undefined && { isParameterized }),
    };

    // Pass the update data to the repository
    return this.linkRepository.updateLink(linkId, updateData);
  }

  async deleteLink(linkId: string): Promise<void> {
    return this.linkRepository.deleteLink(linkId);
  }
}
