import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { WellKnownService } from './well-known.service';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';


interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('well-known')
export class WellKnownController {
  constructor(private readonly wellKnownService: WellKnownService) {}

  @Post('create')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async create(
    @Body() createDto: CreateWellKnownDTO,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      const result = await this.wellKnownService.create(userId, createDto);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      console.error('Error creating well-known file:', error);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Failed to create well-known file',
      });
    }
  }

  @Post('getAll')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      const files = await this.wellKnownService.findAll(userId);
      res.status(HttpStatus.OK).json(files);
    } catch (error) {
      console.error('Error fetching well-known files:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch well-known files',
      });
    }
  }

  @Post('getById')
  async findById(
    @Body() body: { id: string },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      const file = await this.wellKnownService.findById(body.id, userId);
      res.status(HttpStatus.OK).json(file);
    } catch (error) {
      console.error('Error fetching well-known file:', error);
      res.status(HttpStatus.NOT_FOUND).json({
        message: error.message || 'Well-known file not found',
      });
    }
  }

  @Post('update')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  async update(
    @Body() body: { id: string; data: UpdateWellKnownDTO },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      const result = await this.wellKnownService.update(body.id, userId, body.data);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Error updating well-known file:', error);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Failed to update well-known file',
      });
    }
  }

  @Post('delete')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async delete(
    @Body() body: { id: string },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      await this.wellKnownService.delete(body.id, userId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      console.error('Error deleting well-known file:', error);
      res.status(HttpStatus.NOT_FOUND).json({
        message: error.message || 'Well-known file not found',
      });
    }
  }
}
