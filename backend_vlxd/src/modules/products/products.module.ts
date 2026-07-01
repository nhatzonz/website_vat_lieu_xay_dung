import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from '../attributes/attribute.entity';
import { Category } from '../categories/category.entity';
import { Tag } from '../tags/tag.entity';
import { UploadModule } from '../upload/upload.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductTestMedia } from './entities/product-test-media.entity';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductAttributeValue,
      ProductTestMedia,
      Category,
      Tag,
      Attribute,
    ]),
    UploadModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
