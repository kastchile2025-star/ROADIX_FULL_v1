import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Taller } from './taller.entity.js';
import { Plan } from './plan.entity.js';
import { HistorialPagoSuscripcion } from './historial-pago-suscripcion.entity.js';
import { SuscripcionEstado, SuscripcionPeriodo } from '../../common/enums.js';

@Entity('suscripcion')
export class Suscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column()
  plan_id: number;

  @Column({ type: 'enum', enum: SuscripcionPeriodo, default: SuscripcionPeriodo.MENSUAL })
  periodo: SuscripcionPeriodo;

  @Column({ type: 'enum', enum: SuscripcionEstado, default: SuscripcionEstado.TRIAL })
  estado: SuscripcionEstado;

  @Column({ type: 'timestamp' })
  fecha_inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_fin: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_hasta: Date;

  @Column({ type: 'timestamp', nullable: true })
  proximo_cobro: Date;

  @Column({ length: 50, nullable: true })
  metodo_pago: string;

  @Column({ nullable: true })
  referencia_pago: string;

  @Column({ nullable: true })
  referencia_pago_externa: string;

  @Column({ type: 'int', default: 0 })
  billing_retry_count: number;

  @Column({ type: 'timestamp', nullable: true })
  billing_last_retry_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  billing_next_retry_at: Date;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  monto_pagado: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  descuento_pct: number;

  @Column({ default: true })
  auto_renovar: boolean;

  @Column({ type: 'timestamp', nullable: true })
  cancelado_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Taller, (t) => t.suscripciones)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @ManyToOne(() => Plan, (p) => p.suscripciones)
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<Plan>;

  @OneToMany(() => HistorialPagoSuscripcion, (h) => h.suscripcion)
  historial_pagos: Relation<HistorialPagoSuscripcion[]>;
}
