import { IsUrl, IsOptional, IsString } from 'class-validator';

export class EditProjectDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  fallbackUrl?: string;

  @IsOptional()
  @IsString()
  appstoreId?: string;

  @IsOptional()
  @IsString()
  playstoreId?: string;

  @IsOptional()
  @IsString()
  iosScheme?: string;

  @IsOptional()
  @IsString()
  androidScheme?: string;
}
