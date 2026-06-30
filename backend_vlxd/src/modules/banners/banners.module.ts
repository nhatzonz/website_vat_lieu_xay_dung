import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from '../upload/upload.module';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { Banner } from './banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banner]), UploadModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
