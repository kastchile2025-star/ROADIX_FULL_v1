import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Suscripcion } from './suscripcion.entity.js';

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  precio_mensual: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  precio_anual: number;

  @Column({ type: 'int' })
  max_usuarios: number;

  @Column({ type: 'int' })
  max_ots_mes: number;

  @Column({ type: 'int' })
  max_vehiculos: number;

  @Column({ type: 'int' })
  max_storage_mb: number;

  @Column({ default: false })
  tiene_facturacion: boolean;

  @Column({ default: false })
  tiene_whatsapp: boolean;

  @Column({ default: false })
  tiene_portal: boolean;

  @Column({ default: false })
  tiene_reportes: boolean;

  @Column({ default: false })
  tiene_api: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Suscripcion, (s) => s.plan)
  suscripciones: Relation<Suscripcion[]>;
}
