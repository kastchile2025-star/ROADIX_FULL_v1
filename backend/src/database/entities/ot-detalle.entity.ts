import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity.js';
import { Repuesto } from './repuesto.entity.js';
import { TipoOtDetalle } from '../../common/enums.js';

@Entity('ot_detalle')
export class OtDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ot_id: number;

  @Column({ type: 'enum', enum: TipoOtDetalle })
  tipo: TipoOtDetalle;

  @Column({ nullable: true })
  repuesto_id: number;

  @Column({ length: 500 })
  descripcion: string;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  precio_unit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  subtotal: number;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.detalles)
  @JoinColumn({ name: 'ot_id' })
  orden_trabajo: Relation<OrdenTrabajo>;

  @ManyToOne(() => Repuesto, { nullable: true })
  @JoinColumn({ name: 'repuesto_id' })
  repuesto: Relation<Repuesto>;
}
