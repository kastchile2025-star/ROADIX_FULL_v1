import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Repuesto } from './repuesto.entity.js';
import { OtDetalle } from './ot-detalle.entity.js';
import { Usuario } from './usuario.entity.js';
import { TipoMovimientoStock } from '../../common/enums.js';

@Entity('movimiento_stock')
export class MovimientoStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  repuesto_id: number;

  @Column({ nullable: true })
  ot_detalle_id: number;

  @Column({ type: 'enum', enum: TipoMovimientoStock })
  tipo: TipoMovimientoStock;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @Column({ nullable: true })
  usuario_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Repuesto)
  @JoinColumn({ name: 'repuesto_id' })
  repuesto: Relation<Repuesto>;

  @ManyToOne(() => OtDetalle, { nullable: true })
  @JoinColumn({ name: 'ot_detalle_id' })
  ot_detalle: Relation<OtDetalle>;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;
}
