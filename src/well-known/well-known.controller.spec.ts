import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { WellKnownController } from './well-known.controller';
import { WellKnownService } from './well-known.service';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';
import { WellKnownResponseDTO } from './dto/well-known-response.dto';

describe('WellKnownController', () => {
  let controller: WellKnownController;
  let service: jest.Mocked<WellKnownService>;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockRequest = {
    user: {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
    },
  };

  const mockWellKnownResponse: WellKnownResponseDTO = {
    id: 'test-id',
    filename: 'assetlinks.json',
    content: '[]',
    contentType: 'application/json',
    enabled: true,
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getPublicFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WellKnownController],
      providers: [
        {
          provide: WellKnownService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WellKnownController>(WellKnownController);
    service = module.get(WellKnownService);
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

      service.create.mockResolvedValue(mockWellKnownResponse);

      await controller.create(createDto, mockRequest as any, mockResponse);

      expect(service.create).toHaveBeenCalledWith('test-user-id', createDto);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWellKnownResponse);
    });

    it('should return 401 if user not authenticated', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'assetlinks.json',
        content: '[]',
        contentType: 'application/json',
      };

      const unauthenticatedRequest = { user: undefined };

      await controller.create(createDto, unauthenticatedRequest as any, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should handle service errors', async () => {
      const createDto: CreateWellKnownDTO = {
        filename: 'assetlinks.json',
        content: '[]',
        contentType: 'application/json',
      };

      service.create.mockRejectedValue(new Error('Validation failed'));

      await controller.create(createDto, mockRequest as any, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation failed',
      });
    });
  });

  describe('findAll', () => {
    it('should return all files for authenticated user', async () => {
      service.findAll.mockResolvedValue([mockWellKnownResponse]);

      await controller.findAll(mockRequest as any, mockResponse);

      expect(service.findAll).toHaveBeenCalledWith('test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([mockWellKnownResponse]);
    });

    it('should return 401 if user not authenticated', async () => {
      const unauthenticatedRequest = { user: undefined };

      await controller.findAll(unauthenticatedRequest as any, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
  });

  describe('findById', () => {
    it('should return file by id', async () => {
      service.findById.mockResolvedValue(mockWellKnownResponse);

      await controller.findById('test-id', mockRequest as any, mockResponse);

      expect(service.findById).toHaveBeenCalledWith('test-id', 'test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWellKnownResponse);
    });

    it('should return 404 if file not found', async () => {
      service.findById.mockRejectedValue(new Error('File not found'));

      await controller.findById('test-id', mockRequest as any, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File not found',
      });
    });
  });

  describe('update', () => {
    it('should update file successfully', async () => {
      const updateDto: UpdateWellKnownDTO = {
        content: '[{"relation": ["delegate_permission/common.handle_all_urls"]}]',
        enabled: false,
      };

      const updatedResponse = { ...mockWellKnownResponse, ...updateDto };
      service.update.mockResolvedValue(updatedResponse);

      await controller.update('test-id', updateDto, mockRequest as any, mockResponse);

      expect(service.update).toHaveBeenCalledWith('test-id', 'test-user-id', updateDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedResponse);
    });

    it('should handle update errors', async () => {
      const updateDto: UpdateWellKnownDTO = {
        content: 'invalid content',
      };

      service.update.mockRejectedValue(new Error('Update failed'));

      await controller.update('test-id', updateDto, mockRequest as any, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Update failed',
      });
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('test-id', mockRequest as any, mockResponse);

      expect(service.delete).toHaveBeenCalledWith('test-id', 'test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      service.delete.mockRejectedValue(new Error('Delete failed'));

      await controller.delete('test-id', mockRequest as any, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Delete failed',
      });
    });
  });
});
