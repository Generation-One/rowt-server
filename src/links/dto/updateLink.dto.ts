import { IsUUID, IsUrl, IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';

export class UpdateLinkDTO {
  @IsUUID()
  @IsString()
  projectId: string;

  @IsString()
  apiKey: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsDate()
  @IsOptional()
  expiration?: Date;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  fallbackUrlOverride?: string;

  @IsOptional()
  additionalMetadata?: Record<string, any>;

  @IsOptional()
  properties?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
