import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity.js';
import { Taller } from './taller.entity.js';
import { MetodoPago } from '../../common/enums.js';

@Entity('pago')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ot_id: number;

  @Column()
  taller_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 0 })
  monto: number;

  @Column({ type: 'enum', enum: MetodoPago })
  metodo_pago: MetodoPago;

  @Column({ nullable: true })
  referencia: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_pago: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => OrdenTrabajo)
  @JoinColumn({ name: 'ot_id' })
  orden_trabajo: Relation<OrdenTrabajo>;

  @ManyToOne(() => Taller)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;
}
