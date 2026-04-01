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
import { TipoDte } from '../../common/enums.js';

@Entity('factura')
export class Factura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ot_id: number;

  @Column()
  taller_id: number;

  @Column({ length: 50, nullable: true })
  numero_dte: string;

  @Column({ type: 'enum', enum: TipoDte })
  tipo_dte: TipoDte;

  @Column({ length: 20, nullable: true })
  rut_receptor: string;

  @Column({ type: 'text', nullable: true })
  xml_dte: string;

  @Column({ nullable: true })
  pdf_url: string;

  @Column({ length: 50, nullable: true })
  estado_sii: string;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  monto_neto: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  monto_total: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => OrdenTrabajo)
  @JoinColumn({ name: 'ot_id' })
  orden_trabajo: Relation<OrdenTrabajo>;

  @ManyToOne(() => Taller)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;
}
