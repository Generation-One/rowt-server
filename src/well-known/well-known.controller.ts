import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { WellKnownService } from './well-known.service';
import { CreateWellKnownDTO } from './dto/create-well-known.dto';
import { UpdateWellKnownDTO } from './dto/update-well-known.dto';
import { Public } from 'src/auth/public.guard';

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

  @Post()
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

  @Get()
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

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      const file = await this.wellKnownService.findById(id, userId);
      res.status(HttpStatus.OK).json(file);
    } catch (error) {
      console.error('Error fetching well-known file:', error);
      res.status(HttpStatus.NOT_FOUND).json({
        message: error.message || 'Well-known file not found',
      });
    }
  }

  @Put(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWellKnownDTO,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      const result = await this.wellKnownService.update(id, userId, updateDto);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Error updating well-known file:', error);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Failed to update well-known file',
      });
    }
  }

  @Delete(':id')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async delete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
        return;
      }

      await this.wellKnownService.delete(id, userId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      console.error('Error deleting well-known file:', error);
      res.status(HttpStatus.NOT_FOUND).json({
        message: error.message || 'Well-known file not found',
      });
    }
  }
}
