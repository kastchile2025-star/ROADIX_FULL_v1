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
import { PresupuestoEstado } from '../../common/enums.js';

@Entity('presupuesto')
export class Presupuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ot_id: number;

  @Column()
  taller_id: number;

  @Column({ length: 50 })
  numero: string;

  @Column({ type: 'enum', enum: PresupuestoEstado, default: PresupuestoEstado.BORRADOR })
  estado: PresupuestoEstado;

  @Column({ type: 'jsonb', nullable: true })
  items_json: unknown[];

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  total: number;

  @Column({ nullable: true })
  pdf_url: string;

  @Column({ default: false })
  enviado_email: boolean;

  @Column({ default: false })
  enviado_wsp: boolean;

  @Column({ type: 'timestamp', nullable: true })
  aprobado_at: Date;

  @Column({ nullable: true })
  firma_url: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => OrdenTrabajo)
  @JoinColumn({ name: 'ot_id' })
  orden_trabajo: Relation<OrdenTrabajo>;

  @ManyToOne(() => Taller)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;
}
