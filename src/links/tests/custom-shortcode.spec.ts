import { Test, TestingModule } from '@nestjs/testing';
import { LinkService } from '../link.service';
import { CreateLinkDTO } from '../dto/createLink.dto';
import { BadRequestException } from '@nestjs/common';

describe('Custom Shortcode Feature', () => {
  let linkService: LinkService;
  let mockLinkRepository: any;

  beforeEach(async () => {
    mockLinkRepository = {
      findLinkById: jest.fn(),
      createLink: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkService,
        {
          provide: 'LinkRepositoryPort',
          useValue: mockLinkRepository,
        },
      ],
    }).compile();

    linkService = module.get<LinkService>(LinkService);
  });

  describe('createLink with custom shortcode', () => {
    it('should create link with custom shortcode', async () => {
      const createLinkDto: CreateLinkDTO = {
        projectId: 'test-project-id',
        apiKey: 'test-api-key',
        url: 'https://example.com',
        customShortcode: 'my-custom',
      };

      mockLinkRepository.findLinkById.mockResolvedValue(null); // No existing link
      mockLinkRepository.createLink.mockResolvedValue('my-custom');

      const result = await linkService.createLink(createLinkDto);
      expect(result).toBe('my-custom');
      expect(mockLinkRepository.findLinkById).toHaveBeenCalledWith('my-custom');
    });

    it('should reject duplicate custom shortcode', async () => {
      const createLinkDto: CreateLinkDTO = {
        projectId: 'test-project-id',
        apiKey: 'test-api-key',
        url: 'https://example.com',
        customShortcode: 'duplicate-test',
      };

      mockLinkRepository.findLinkById.mockResolvedValue({ id: 'duplicate-test' }); // Existing link

      await expect(linkService.createLink(createLinkDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(linkService.createLink(createLinkDto)).rejects.toThrow(
        'Custom shortcode already exists. Please choose a different one.',
      );
    });

    it('should reject reserved words', async () => {
      const createLinkDto: CreateLinkDTO = {
        projectId: 'test-project-id',
        apiKey: 'test-api-key',
        url: 'https://example.com',
        customShortcode: 'api',
      };

      mockLinkRepository.findLinkById.mockResolvedValue(null);

      await expect(linkService.createLink(createLinkDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(linkService.createLink(createLinkDto)).rejects.toThrow(
        'Custom shortcode uses a reserved word. Please choose a different one.',
      );
    });

    it('should work without custom shortcode (backward compatibility)', async () => {
      const createLinkDto: CreateLinkDTO = {
        projectId: 'test-project-id',
        apiKey: 'test-api-key',
        url: 'https://example.com',
      };

      mockLinkRepository.createLink.mockResolvedValue('auto-generated-id');

      const result = await linkService.createLink(createLinkDto);
      expect(result).toBe('auto-generated-id');
      expect(mockLinkRepository.findLinkById).not.toHaveBeenCalled();
    });
  });
});
