import {
  Body,
  Controller,
  Post,
  Put,
  Param,
  Req,
  Res,
  NotFoundException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { UpdateProjectDTO } from './dto/updateProjectDTO';
import { EditProjectDTO } from './dto/editProject.dto';
import { ProjectService } from './project.service';
import { GetProjectOptions } from './project.model';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    // other user properties
  };
}

@Controller('projects')
class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Throttle({ default: { limit: 10, ttl: 5000 } })
  @Post('getById')
  async getById(
    @Body() body: { id: string; options: GetProjectOptions },
    @Res() res: Response,
  ): Promise<void> {
    try {
      console.log('ProjectController.getProject');
      console.log(body.id);
      console.log(body.options);

      const { id: projectId, options } = body;

      if (!projectId) {
        res.status(400).json({ message: 'Missing projectId' });
        return;
      }

      const query = await this.projectService.findById(projectId, options);
      const { project, previousPeriodInteractionCount } = query;

      console.log('Project being returned');
      const payload = {
        ...project,
        previousPeriodInteractionCount,
      };
      // console.log(payload);
      res.status(200).json(payload);
    } catch (error) {
      console.error('Error fetching project', error);
      res.status(500).json({
        message:
          error.message || 'An error occurred while fetching the project.',
      });
    }
  }

  @Post('getUserProjects')
  async getUserProjects(@Req() req, @Res() res: Response): Promise<void> {
    console.log('ProjectController.getUserProjects');
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(400).json({ message: 'Missing userId' });
        return;
      }
      console.log(`getting projects for user ${userId}`);

      const projects = await this.projectService.getUserProjects(userId);

      res.status(200).json(projects);
    } catch (error) {
      console.error('Error fetching user projects', error);
      res.status(500).json({
        message:
          error.message || 'An error occurred while fetching user projects.',
      });
    }
  }

  @Post('update')
  async updateProject(
    @Body() body: UpdateProjectDTO,
    @Res() res: Response,
  ): Promise<void> {
    console.log('ProjectController.updateProject');
    try {
      const project = body;
      console.log(`updating project ${project.id}`);

      if (!project) {
        console.error('Missing project');
        res.status(400).json({ message: 'Missing project' });
        return;
      }

      const updatedProject = await this.projectService.updateProject(project);

      res.status(200).json(updatedProject);
    } catch (error) {
      console.error('Error updating project', error);
      res.status(500).json({
        message:
          error.message || 'An error occurred while updating the project.',
      });
    }
  }

  @Post('create')
  async createProject(
    @Body() body: UpdateProjectDTO,
    @Res() res: Response,
  ): Promise<void> {
    console.log('ProjectController.createProject');
    try {
      const project = body;
      console.log(`creating project ${project.name}`);
      console.log(project);
      if (!project) {
        console.error('Missing project');
        res.status(400).json({ message: 'Missing project' });
        return;
      }
      const createdProject = await this.projectService.createProject(project);
      res.status(200).json(createdProject);
    } catch (error) {
      console.error('Error creating project', error);
      res.status(500).json({
        message:
          error.message || 'An error occurred while creating the project.',
      });
    }
  }

  @Post('generateApiKey')
  async generateApiKey(
    @Body() body: { projectId: string },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!body.projectId) {
        res.status(400).json({ message: 'Missing projectId' });
        return;
      }

      const newApiKey = await this.projectService.regenerateApiKey(
        body.projectId,
        userId,
      );
      res.status(200).json({ apiKey: newApiKey });
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Error generating API key' });
      }
    }
  }

  @Put(':id')
  async editProject(
    @Param('id') projectId: string,
    @Body() editProjectRequest: EditProjectDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      if (!editProjectRequest) {
        throw new HttpException('Invalid request - missing body', HttpStatus.BAD_REQUEST);
      }

      if (!projectId) {
        throw new HttpException('Missing project ID', HttpStatus.BAD_REQUEST);
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException('Unauthorized - missing user ID', HttpStatus.UNAUTHORIZED);
      }

      // Edit the project
      const updatedProject = await this.projectService.editProject(projectId, userId, editProjectRequest);

      if (!updatedProject) {
        throw new HttpException('Failed to edit project', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Return success response with updated project data
      return {
        message: 'Project updated successfully',
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          baseUrl: updatedProject.baseUrl,
          fallbackUrl: updatedProject.fallbackUrl,
          appstoreId: updatedProject.appstoreId,
          playstoreId: updatedProject.playstoreId,
          iosScheme: updatedProject.iosScheme,
          androidScheme: updatedProject.androidScheme,
          apiKey: updatedProject.apiKey,
          userId: updatedProject.userId,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle specific error types
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        throw new HttpException('Project not found or access denied', HttpStatus.NOT_FOUND);
      }

      console.error('Error editing project:', error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export default ProjectController;
