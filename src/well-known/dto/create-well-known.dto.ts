import { IsString, IsOptional, IsBoolean, MaxLength, IsIn, Matches, MinLength } from 'class-validator';

export class CreateWellKnownDTO {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Filename can only contain alphanumeric characters, dots, hyphens, and underscores'
  })
  filename: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1048576) // 1MB limit
  content: string;

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
  contentType?: string = 'application/json';

  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;
}
