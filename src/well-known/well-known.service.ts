import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { WellKnownRepositoryPort } from './well-known.repository.port';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';
import { WellKnownResponseDTO } from './dto/well-known-response.dto';
import { WellKnownEntity } from './well-known.entity';

@Injectable()
export class WellKnownService {
  constructor(
    @Inject('WellKnownRepository')
    private readonly wellKnownRepository: WellKnownRepositoryPort,
  ) {}

  async create(userId: string, createDto: CreateWellKnownDTO): Promise<WellKnownResponseDTO> {
    // Validate filename format (RFC 8615 compliance)
    this.validateFilename(createDto.filename);

    // Validate content size (max 1MB)
    this.validateContentSize(createDto.content);

    // Validate content for security issues
    this.validateContentSecurity(createDto.content, createDto.contentType);

    const wellKnownFile = await this.wellKnownRepository.create(userId, createDto);
    return this.toResponseDTO(wellKnownFile);
  }

  async findAll(userId: string): Promise<WellKnownResponseDTO[]> {
    const files = await this.wellKnownRepository.findAll(userId);
    return files.map(file => this.toResponseDTO(file));
  }

  async findById(id: string, userId: string): Promise<WellKnownResponseDTO> {
    const file = await this.wellKnownRepository.findById(id, userId);
    if (!file) {
      throw new BadRequestException('Well-known file not found');
    }
    return this.toResponseDTO(file);
  }

  async update(id: string, userId: string, updateDto: UpdateWellKnownDTO): Promise<WellKnownResponseDTO> {
    if (updateDto.content) {
      this.validateContentSize(updateDto.content);
      this.validateContentSecurity(updateDto.content, updateDto.contentType);
    }

    const wellKnownFile = await this.wellKnownRepository.update(id, userId, updateDto);
    return this.toResponseDTO(wellKnownFile);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.wellKnownRepository.delete(id, userId);
  }

  async getPublicFile(filename: string): Promise<{ content: string; contentType: string } | null> {
    const file = await this.wellKnownRepository.findEnabledByFilename(filename);
    if (!file) {
      return null;
    }
    return {
      content: file.content,
      contentType: file.contentType,
    };
  }

  private validateFilename(filename: string): void {
    // RFC 8615 compliant filename validation
    const validFilenameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validFilenameRegex.test(filename)) {
      throw new BadRequestException('Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed.');
    }

    // Check for reserved filenames
    const reservedNames = ['security.txt', 'robots.txt', 'sitemap.xml'];
    if (reservedNames.includes(filename.toLowerCase())) {
      throw new BadRequestException(`Filename '${filename}' is reserved and cannot be used.`);
    }

    // Prevent path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename. Path traversal attempts are not allowed.');
    }

    // Prevent excessively long filenames
    if (filename.length > 255) {
      throw new BadRequestException('Filename is too long. Maximum length is 255 characters.');
    }
  }

  private validateContentSize(content: string): void {
    const maxSize = 1024 * 1024; // 1MB
    const contentSize = Buffer.byteLength(content, 'utf8');
    if (contentSize > maxSize) {
      throw new BadRequestException(`Content size exceeds maximum allowed size of ${maxSize} bytes`);
    }
  }

  private validateContentSecurity(content: string, contentType?: string): void {
    // Check for potentially malicious content
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript URLs
      /vbscript:/gi, // VBScript URLs
      /on\w+\s*=/gi, // Event handlers
      /data:text\/html/gi, // Data URLs with HTML
      /\beval\s*\(/gi, // eval() calls
      /\bFunction\s*\(/gi, // Function constructor
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new BadRequestException('Content contains potentially malicious code and cannot be saved.');
      }
    }

    // Validate JSON content if content type is JSON
    if (contentType === 'application/json') {
      try {
        JSON.parse(content);
      } catch (error) {
        throw new BadRequestException('Invalid JSON content. Please check your syntax.');
      }
    }

    // Validate XML content if content type is XML
    if (contentType === 'application/xml' || contentType === 'text/xml') {
      // Basic XML validation - check for balanced tags
      const openTags = (content.match(/<[^\/][^>]*>/g) || []).length;
      const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
      const selfClosingTags = (content.match(/<[^>]*\/>/g) || []).length;

      if (openTags !== closeTags + selfClosingTags) {
        throw new BadRequestException('Invalid XML content. Tags are not properly balanced.');
      }
    }

    // Check for excessively nested content that could cause DoS
    const maxNestingLevel = 50;
    let currentLevel = 0;
    let maxLevel = 0;

    for (const char of content) {
      if (char === '{' || char === '[' || char === '<') {
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (char === '}' || char === ']' || char === '>') {
        currentLevel--;
      }
    }

    if (maxLevel > maxNestingLevel) {
      throw new BadRequestException(`Content nesting level exceeds maximum allowed depth of ${maxNestingLevel}.`);
    }
  }

  private toResponseDTO(entity: WellKnownEntity): WellKnownResponseDTO {
    return {
      id: entity.id,
      filename: entity.filename,
      content: entity.content,
      contentType: entity.contentType,
      enabled: entity.enabled,
      userId: entity.userId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
