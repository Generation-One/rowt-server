import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import ProjectController from './project.controller';
import { ProjectService } from './project.service';
import { EditProjectDTO } from './dto/editProject.dto';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../users/user.entity';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: ProjectService;

  const mockUserEntity = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'user',
    emailVerified: true,
    customerId: null,
  } as unknown as UserEntity;

  const mockProjectEntity = {
    id: 'test-project-id',
    apiKey: 'test-api-key',
    baseUrl: 'https://example.com',
    fallbackUrl: 'https://example.com/fallback',
    appstoreId: 'app123',
    playstoreId: 'play456',
    iosScheme: 'myapp',
    androidScheme: 'myapp',
    userId: 'test-user-id',
    name: 'Test Project',
    user: mockUserEntity,
    links: [],
    generateApiKey: jest.fn(),
  } as unknown as ProjectEntity;

  const mockProjectService = {
    editProject: jest.fn(),
  };

  const mockAuthenticatedRequest = {
    user: {
      userId: 'test-user-id',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('editProject', () => {
    const editProjectDto: EditProjectDTO = {
      name: 'Updated Project Name',
      baseUrl: 'https://updated-example.com',
      fallbackUrl: 'https://updated-example.com/fallback',
      appstoreId: 'newapp123',
      playstoreId: 'newplay456',
      iosScheme: 'updatedapp',
      androidScheme: 'updatedapp',
    };

    it('should successfully edit a project', async () => {
      // Arrange
      const updatedProject = { ...mockProjectEntity, ...editProjectDto };
      mockProjectService.editProject.mockResolvedValue(updatedProject);

      // Act
      const result = await controller.editProject('test-project-id', editProjectDto, mockAuthenticatedRequest as any);

      // Assert
      expect(mockProjectService.editProject).toHaveBeenCalledWith('test-project-id', 'test-user-id', editProjectDto);
      expect(result).toEqual({
        message: 'Project updated successfully',
        project: expect.objectContaining({
          id: 'test-project-id',
          name: 'Updated Project Name',
          baseUrl: 'https://updated-example.com',
          fallbackUrl: 'https://updated-example.com/fallback',
        }),
      });
    });

    it('should throw 401 when user is not authenticated', async () => {
      // Arrange
      const unauthenticatedRequest = { user: undefined };

      // Act & Assert
      await expect(controller.editProject('test-project-id', editProjectDto, unauthenticatedRequest as any))
        .rejects
        .toThrow(new HttpException('Unauthorized - missing user ID', HttpStatus.UNAUTHORIZED));
    });

    it('should throw 404 when project is not found or access denied', async () => {
      // Arrange
      mockProjectService.editProject.mockRejectedValue(new Error('Project not found or access denied'));

      // Act & Assert
      await expect(controller.editProject('non-existent-id', editProjectDto, mockAuthenticatedRequest as any))
        .rejects
        .toThrow(new HttpException('Project not found or access denied', HttpStatus.NOT_FOUND));
    });

    it('should throw 400 when request body is missing', async () => {
      // Act & Assert
      await expect(controller.editProject('test-project-id', null as any, mockAuthenticatedRequest as any))
        .rejects
        .toThrow(new HttpException('Invalid request - missing body', HttpStatus.BAD_REQUEST));
    });

    it('should throw 400 when project ID is missing', async () => {
      // Act & Assert
      await expect(controller.editProject('', editProjectDto, mockAuthenticatedRequest as any))
        .rejects
        .toThrow(new HttpException('Missing project ID', HttpStatus.BAD_REQUEST));
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdateDto: EditProjectDTO = {
        name: 'Only Name Updated',
      };
      const updatedProject = { ...mockProjectEntity, name: 'Only Name Updated' };
      mockProjectService.editProject.mockResolvedValue(updatedProject);

      // Act
      const result = await controller.editProject('test-project-id', partialUpdateDto, mockAuthenticatedRequest as any);

      // Assert
      expect(mockProjectService.editProject).toHaveBeenCalledWith('test-project-id', 'test-user-id', partialUpdateDto);
      expect(result.project.name).toBe('Only Name Updated');
    });

    it('should throw 500 when service returns null', async () => {
      // Arrange
      mockProjectService.editProject.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.editProject('test-project-id', editProjectDto, mockAuthenticatedRequest as any))
        .rejects
        .toThrow(new HttpException('Failed to edit project', HttpStatus.INTERNAL_SERVER_ERROR));
    });
  });
});
