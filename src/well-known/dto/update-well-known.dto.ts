import { IsString, IsOptional, IsBoolean, MaxLength, IsIn, MinLength } from 'class-validator';

export class UpdateWellKnownDTO {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1048576) // 1MB limit
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @IsIn([
    'application/json',
    'text/plain',
    'application/xml',
    'text/xml',
    'application/octet-stream',
    'text/html',
  ])
  contentType?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
