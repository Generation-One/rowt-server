import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { WellKnownService } from './well-known.service';
import { WellKnownRepositoryPort } from './well-known.repository.port';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';
import { WellKnownEntity } from './well-known.entity';

describe('WellKnownService', () => {
  let service: WellKnownService;
  let repository: jest.Mocked<WellKnownRepositoryPort>;

  const mockWellKnownEntity: WellKnownEntity = {
    id: 'test-id',
    filename: 'assetlinks.json',
    content: '[]',
    contentType: 'application/json',
    enabled: true,
    userId: 'user-id',
    user: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByFilename: jest.fn(),
    findEnabledByFilename: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WellKnownService,
        {
          provide: 'WellKnownRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WellKnownService>(WellKnownService);
    repository = module.get('WellKnownRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a well-known file successfully', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'assetlinks.json',
        content: '[]',
        contentType: 'application/json',
        enabled: true,
      };

      repository.create.mockResolvedValue(mockWellKnownEntity);

      const result = await service.create('user-id', createDto);

      expect(repository.create).toHaveBeenCalledWith('user-id', createDto);
      expect(result.filename).toBe('assetlinks.json');
    });

    it('should throw error for invalid filename', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'invalid@filename',
        content: '[]',
        contentType: 'application/json',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for reserved filename', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'robots.txt',
        content: 'User-agent: *',
        contentType: 'text/plain',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for content too large', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'large.json',
        content: 'x'.repeat(1048577), // 1MB + 1 byte
        contentType: 'application/json',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for malicious content', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'malicious.json',
        content: '<script>alert("xss")</script>',
        contentType: 'application/json',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid JSON', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'invalid.json',
        content: '{ invalid json }',
        contentType: 'application/json',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all files for user', async () => {
      repository.findAll.mockResolvedValue([mockWellKnownEntity]);

      const result = await service.findAll('user-id');

      expect(repository.findAll).toHaveBeenCalledWith('user-id');
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('assetlinks.json');
    });
  });

  describe('findById', () => {
    it('should return file by id', async () => {
      repository.findById.mockResolvedValue(mockWellKnownEntity);

      const result = await service.findById('test-id', 'user-id');

      expect(repository.findById).toHaveBeenCalledWith('test-id', 'user-id');
      expect(result.filename).toBe('assetlinks.json');
    });

    it('should throw error if file not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('test-id', 'user-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update file successfully', async () => {
      const updateDto: UpdateWellKnownDTO = {
        content: '[{"relation": ["delegate_permission/common.handle_all_urls"]}]',
        enabled: false,
      };

      const updatedEntity = { ...mockWellKnownEntity, ...updateDto };
      repository.update.mockResolvedValue(updatedEntity);

      const result = await service.update('test-id', 'user-id', updateDto);

      expect(repository.update).toHaveBeenCalledWith('test-id', 'user-id', updateDto);
      expect(result.enabled).toBe(false);
    });

    it('should validate content on update', async () => {
      const updateDto: UpdateWellKnownDTO = {
        content: '<script>alert("xss")</script>',
      };

      await expect(service.update('test-id', 'user-id', updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      repository.delete.mockResolvedValue(undefined);

      await service.delete('test-id', 'user-id');

      expect(repository.delete).toHaveBeenCalledWith('test-id', 'user-id');
    });
  });

  describe('getPublicFile', () => {
    it('should return enabled file content', async () => {
      repository.findEnabledByFilename.mockResolvedValue(mockWellKnownEntity);

      const result = await service.getPublicFile('assetlinks.json');

      expect(result).toEqual({
        content: '[]',
        contentType: 'application/json',
      });
    });

    it('should return null for disabled or non-existent file', async () => {
      repository.findEnabledByFilename.mockResolvedValue(null);

      const result = await service.getPublicFile('nonexistent.json');

      expect(result).toBeNull();
    });
  });

  describe('validation methods', () => {
    it('should validate filename with path traversal attempt', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: '../../../etc/passwd',
        content: 'malicious',
        contentType: 'text/plain',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate deeply nested content', async () => {
      const deeplyNested = '{'.repeat(60) + '}'.repeat(60);
      const createDto: CreateWellKnownDTO = {
        filename: 'deep.json',
        content: deeplyNested,
        contentType: 'application/json',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate XML content', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'test.xml',
        content: '<root><unclosed></root>',
        contentType: 'application/xml',
      };

      await expect(service.create('user-id', createDto)).rejects.toThrow(BadRequestException);
    });
  });
});
