import { Body, Controller, Get, Post, Put, Delete, Param, Req, HttpStatus, HttpException } from '@nestjs/common';
import { LinkService } from './link.service';
import { CreateLinkDTO } from './dto/createLink.dto';
import { UpdateLinkDTO } from './dto/updateLink.dto';
import { DeleteLinkDTO } from './dto/deleteLink.dto';
import { Public } from 'src/auth/public.guard';
import { readHtmlFile } from 'src/utils/readHtmlFile';
import { ProjectService } from 'src/projects/project.service';

@Controller('link')
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly projectService: ProjectService,
  ) {}

  @Public()
  @Get()
  async RejectGet() {
    return readHtmlFile('src/pages/rejectGet.html');
  }

  @Public()
  @Post()
  async AuthenticateAndCreateLink(
    @Body() createLinkRequest: CreateLinkDTO,
    @Req() req: Request,
  ) {
    try {
      if (!createLinkRequest) {
        throw new Error('Invalid request - missing body');
      }

      const authorized = await this.projectService.authorize(
        createLinkRequest.projectId,
        createLinkRequest.apiKey,
      );
      if (!authorized) {
        throw new Error('Unauthorized');
      }

      if (!createLinkRequest.projectId) {
        throw new Error('Missing projectId');
      }

      const shortcode = await this.linkService.createLink(createLinkRequest);

      if (!shortcode) {
        throw new Error('Failed to create link');
      }

      const host = req.headers['host'];

      return `${host.includes('localhost') ? '' : 'https://'}${host}/${shortcode}`;
    } catch (error) {
      return error.message;
    }
  }

  @Post('byProjectId')
  async getLinksByProjectId(
    @Body() body: { projectId: string; includeInteractions?: boolean },
  ) {
    console.log('Getting links by project id: ', body.projectId);
    try {
      let { projectId, includeInteractions } = body;
      if (
        typeof projectId === 'string' &&
        projectId.startsWith('{') &&
        projectId.endsWith('}')
      ) {
        projectId = JSON.parse(projectId);
      }
      if (!projectId) {
        console.error('Missing projectId');
        throw new Error('Missing projectId');
      }
      const links = await this.linkService.getLinksByProjectId(
        projectId,
        includeInteractions ? includeInteractions : false,
      );

      console.log('Links found: ', links);

      if (!links) {
        throw new Error('No links found');
      }

      return links;
    } catch (error) {
      console.error(`Unable to get links from project: ${error.message}`);

      return `Unable to get links from project: ${error.message}`;
    }
  }

  @Public()
  @Put(':id')
  async updateLink(
    @Param('id') linkId: string,
    @Body() updateLinkRequest: UpdateLinkDTO,
  ) {
    try {
      if (!updateLinkRequest) {
        throw new HttpException('Invalid request - missing body', HttpStatus.BAD_REQUEST);
      }

      if (!linkId) {
        throw new HttpException('Missing link ID', HttpStatus.BAD_REQUEST);
      }

      // First, find the existing link to verify ownership
      const existingLink = await this.linkService.findLinkById(linkId);
      if (!existingLink) {
        throw new HttpException('Link not found', HttpStatus.NOT_FOUND);
      }

      // Verify authorization using the project from the existing link
      const authorized = await this.projectService.authorize(
        existingLink.project.id,
        updateLinkRequest.apiKey,
      );
      if (!authorized) {
        throw new HttpException('Unauthorized - invalid API key for this link', HttpStatus.FORBIDDEN);
      }

      // Verify that the projectId in the request matches the link's project (if provided)
      if (updateLinkRequest.projectId && updateLinkRequest.projectId !== existingLink.project.id) {
        throw new HttpException('Project ID mismatch', HttpStatus.BAD_REQUEST);
      }

      // Update the link
      const updatedLink = await this.linkService.updateLink(linkId, updateLinkRequest);

      if (!updatedLink) {
        throw new HttpException('Failed to update link', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Return success response with updated link data
      return {
        message: 'Link updated successfully',
        link: {
          id: updatedLink.id,
          url: updatedLink.url,
          title: updatedLink.title,
          description: updatedLink.description,
          imageUrl: updatedLink.imageUrl,
          fallbackUrlOverride: updatedLink.fallbackUrlOverride,
          additionalMetadata: updatedLink.additionalMetadata,
          properties: updatedLink.properties,
          lifetimeClicks: updatedLink.lifetimeClicks,
          createdAt: updatedLink.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle specific error types
      if (error.message.includes('not found')) {
        throw new HttpException('Link not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('Unauthorized')) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }
      if (error.message.includes('exceeds') && error.message.includes('limit')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      console.error('Error updating link:', error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Delete(':id')
  async deleteLink(
    @Param('id') linkId: string,
    @Body() deleteLinkRequest: DeleteLinkDTO,
  ) {
    try {
      if (!deleteLinkRequest) {
        throw new HttpException('Invalid request - missing body', HttpStatus.BAD_REQUEST);
      }

      if (!linkId) {
        throw new HttpException('Missing link ID', HttpStatus.BAD_REQUEST);
      }

      // First, find the existing link to verify ownership
      const existingLink = await this.linkService.findLinkById(linkId);
      if (!existingLink) {
        throw new HttpException('Link not found', HttpStatus.NOT_FOUND);
      }

      // Verify authorization using the project from the existing link
      const authorized = await this.projectService.authorize(
        existingLink.project.id,
        deleteLinkRequest.apiKey,
      );
      if (!authorized) {
        throw new HttpException('Unauthorized - invalid API key for this link', HttpStatus.FORBIDDEN);
      }

      // Verify that the projectId in the request matches the link's project (if provided)
      if (deleteLinkRequest.projectId && deleteLinkRequest.projectId !== existingLink.project.id) {
        throw new HttpException('Project ID mismatch', HttpStatus.BAD_REQUEST);
      }

      // Delete the link
      await this.linkService.deleteLink(linkId);

      // Return success response
      return {
        message: 'Link deleted successfully',
        linkId: linkId,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle specific error types
      if (error.message.includes('not found')) {
        throw new HttpException('Link not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('Unauthorized')) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }

      console.error('Error deleting link:', error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
