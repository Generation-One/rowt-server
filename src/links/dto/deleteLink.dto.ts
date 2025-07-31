import { IsUUID, IsString } from 'class-validator';

export class DeleteLinkDTO {
  @IsUUID()
  @IsString()
  projectId: string;

  @IsString()
  apiKey: string;
}
