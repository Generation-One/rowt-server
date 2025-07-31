import { Injectable, Inject } from '@nestjs/common';
import { AppRepositoryPort } from './app.repository.port';
import { LinkEntity } from 'src/links/link.entity';
import { substituteParameters, extractQueryParameters } from '../utils/parameterSubstitution';

@Injectable()
export class AppService {
  constructor(
    @Inject('AppRepository')
    private readonly appRepository: AppRepositoryPort,
  ) {}

  async findLinkByShortCode(shortCode: string): Promise<LinkEntity | null> {
    return this.appRepository.findLinkByShortCode(shortCode);
  }

  async logInteraction(data: {
    shortCode: string;
    country?: string | null;
    referer?: string;
    userAgent?: string;
  }): Promise<void> {
    return this.appRepository.logInteraction(data);
  }

  openAppOnUserDevice(link: LinkEntity, userAgent: string, queryParams?: Record<string, string>): string {
    // If the link is parameterized and we have query parameters, substitute them
    if (link.isParameterized && queryParams && Object.keys(queryParams).length > 0) {
      const substitutionResult = substituteParameters(link.url, queryParams);

      if (!substitutionResult.success) {
        console.error('Parameter substitution failed:', substitutionResult.errors);
        // Fall back to original URL if substitution fails
        return this.appRepository.openAppOnUserDevice(link, userAgent);
      }

      // Create a temporary link with the substituted URL for processing
      // We need to create a proper LinkEntity instance
      const substitutedLink = Object.create(LinkEntity.prototype);
      Object.assign(substitutedLink, link);
      substitutedLink.url = substitutionResult.result!;

      return this.appRepository.openAppOnUserDevice(substitutedLink, userAgent);
    }

    // For non-parameterized links or when no parameters provided, use original logic
    return this.appRepository.openAppOnUserDevice(link, userAgent);
  }
}
