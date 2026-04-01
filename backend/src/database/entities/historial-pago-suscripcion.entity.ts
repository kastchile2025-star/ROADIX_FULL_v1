import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Suscripcion } from './suscripcion.entity.js';
import { PagoSuscripcionEstado } from '../../common/enums.js';

@Entity('historial_pago_suscripcion')
export class HistorialPagoSuscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  suscripcion_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 0 })
  monto: number;

  @Column({ length: 50, nullable: true })
  metodo_pago: string;

  @Column({ nullable: true })
  referencia: string;

  @Column({ nullable: true })
  referencia_externa: string;

  @Column({ nullable: true })
  codigo_respuesta: string;

  @Column({ type: 'text', nullable: true })
  detalle_respuesta: string;

  @Column({ type: 'enum', enum: PagoSuscripcionEstado, default: PagoSuscripcionEstado.PENDIENTE })
  estado: PagoSuscripcionEstado;

  @Column({ type: 'timestamp', nullable: true })
  fecha_pago: Date;

  @Column({ type: 'timestamp', nullable: true })
  periodo_desde: Date;

  @Column({ type: 'timestamp', nullable: true })
  periodo_hasta: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Suscripcion, (s) => s.historial_pagos)
  @JoinColumn({ name: 'suscripcion_id' })
  suscripcion: Relation<Suscripcion>;
}
