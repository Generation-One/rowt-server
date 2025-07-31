import { IsUUID, IsUrl, IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';

export class CreateLinkDTO {
  @IsUUID()
  @IsString()
  projectId: string;

  @IsString()
  apiKey: string;

  @IsString()
  url: string; // Changed from @IsUrl to @IsString to allow parameterized templates

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
  isParameterized?: boolean; // Flag to indicate if this link uses parameter substitution
}
