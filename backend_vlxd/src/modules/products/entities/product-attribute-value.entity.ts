import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { bigintTransformer } from '../../../common/util/column-transformers';
import { Attribute } from '../../attributes/attribute.entity';
import { Product } from './product.entity';

/** Giá trị thuộc tính của một sản phẩm (bảng `product_attribute_values`). */
@Entity('product_attribute_values')
@Index('idx_pav_attribute', ['attributeId'])
export class ProductAttributeValue {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true, transformer: bigintTransformer })
  productId: number;

  @ManyToOne(() => Product, (p) => p.attributeValues, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'attribute_id', type: 'bigint', unsigned: true, transformer: bigintTransformer })
  attributeId: number;

  @ManyToOne(() => Attribute, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'attribute_id' })
  attribute?: Attribute;

  @Column({ length: 500 })
  value: string;
}
