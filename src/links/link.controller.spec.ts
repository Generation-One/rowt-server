import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';
import { ProjectService } from '../projects/project.service';
import { UpdateLinkDTO } from './dto/updateLink.dto';
import { LinkEntity } from './link.entity';
import { ProjectEntity } from '../projects/project.entity';

describe('LinkController', () => {
  let controller: LinkController;
  let linkService: LinkService;
  let projectService: ProjectService;

  const mockProjectEntity = {
    id: 'test-project-id',
    apiKey: 'test-api-key',
    baseUrl: 'https://example.com',
    fallbackUrl: 'https://example.com/fallback',
    appstoreId: null,
    playstoreId: null,
    iosScheme: null,
    androidScheme: null,
    userId: 'test-user-id',
    name: 'Test Project',
    user: null,
    links: [],
    generateApiKey: jest.fn(),
  } as unknown as ProjectEntity;

  const mockLinkEntity = {
    id: 'test-link-id',
    url: 'https://example.com',
    title: 'Test Link',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
    fallbackUrlOverride: null,
    additionalMetadata: {},
    properties: {},
    lifetimeClicks: 0,
    createdAt: new Date(),
    project: mockProjectEntity,
    interactions: [],
    generateCustomUid: jest.fn(),
  } as unknown as LinkEntity;

  const mockLinkService = {
    findLinkById: jest.fn(),
    updateLink: jest.fn(),
  };

  const mockProjectService = {
    authorize: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkController],
      providers: [
        {
          provide: LinkService,
          useValue: mockLinkService,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    controller = module.get<LinkController>(LinkController);
    linkService = module.get<LinkService>(LinkService);
    projectService = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateLink', () => {
    const updateLinkDto: UpdateLinkDTO = {
      projectId: 'test-project-id',
      apiKey: 'test-api-key',
      url: 'https://updated-example.com',
      title: 'Updated Title',
      description: 'Updated Description',
    };

    it('should successfully update a link', async () => {
      // Arrange
      const updatedLink = { ...mockLinkEntity, ...updateLinkDto };
      mockLinkService.findLinkById.mockResolvedValue(mockLinkEntity);
      mockProjectService.authorize.mockResolvedValue(true);
      mockLinkService.updateLink.mockResolvedValue(updatedLink);

      // Act
      const result = await controller.updateLink('test-link-id', updateLinkDto);

      // Assert
      expect(mockLinkService.findLinkById).toHaveBeenCalledWith('test-link-id');
      expect(mockProjectService.authorize).toHaveBeenCalledWith('test-project-id', 'test-api-key');
      expect(mockLinkService.updateLink).toHaveBeenCalledWith('test-link-id', updateLinkDto);
      expect(result).toEqual({
        message: 'Link updated successfully',
        link: expect.objectContaining({
          id: 'test-link-id',
          url: 'https://updated-example.com',
          title: 'Updated Title',
          description: 'Updated Description',
        }),
      });
    });

    it('should throw 404 when link is not found', async () => {
      // Arrange
      mockLinkService.findLinkById.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.updateLink('non-existent-id', updateLinkDto))
        .rejects
        .toThrow(new HttpException('Link not found', HttpStatus.NOT_FOUND));
    });

    it('should throw 403 when API key is invalid', async () => {
      // Arrange
      mockLinkService.findLinkById.mockResolvedValue(mockLinkEntity);
      mockProjectService.authorize.mockResolvedValue(false);

      // Act & Assert
      await expect(controller.updateLink('test-link-id', updateLinkDto))
        .rejects
        .toThrow(new HttpException('Unauthorized - invalid API key for this link', HttpStatus.FORBIDDEN));
    });

    it('should throw 400 when project ID mismatch', async () => {
      // Arrange
      const mismatchDto = { ...updateLinkDto, projectId: 'different-project-id' };
      mockLinkService.findLinkById.mockResolvedValue(mockLinkEntity);
      mockProjectService.authorize.mockResolvedValue(true); // Authorization passes first

      // Act & Assert
      await expect(controller.updateLink('test-link-id', mismatchDto))
        .rejects
        .toThrow(new HttpException('Project ID mismatch', HttpStatus.BAD_REQUEST));
    });

    it('should throw 400 when request body is missing', async () => {
      // Act & Assert
      await expect(controller.updateLink('test-link-id', null as any))
        .rejects
        .toThrow(new HttpException('Invalid request - missing body', HttpStatus.BAD_REQUEST));
    });

    it('should throw 400 when link ID is missing', async () => {
      // Act & Assert
      await expect(controller.updateLink('', updateLinkDto))
        .rejects
        .toThrow(new HttpException('Missing link ID', HttpStatus.BAD_REQUEST));
    });
  });
});
