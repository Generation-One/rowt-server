import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WellKnownEntity } from './well-known.entity';
import { WellKnownController } from './well-known.controller';
import { WellKnownService } from './well-known.service';
import { WellKnownRepositoryAdapter } from './well-known.repository.adapter';
import { WellKnownRepositoryPort } from './well-known.repository.port';
import { UserEntity } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WellKnownEntity, UserEntity])],
  controllers: [WellKnownController],
  providers: [
    {
      provide: 'WellKnownRepository',
      useClass: WellKnownRepositoryAdapter,
    },
    WellKnownService,
  ],
  exports: [WellKnownService],
})
export class WellKnownModule {}
