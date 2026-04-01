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
import { Vehiculo } from './vehiculo.entity.js';
import { Cliente } from './cliente.entity.js';
import { Mecanico } from './mecanico.entity.js';
import { OtDetalle } from './ot-detalle.entity.js';
import { OtFoto } from './ot-foto.entity.js';
import { ChecklistRecepcion } from './checklist-recepcion.entity.js';
import { OtEstado, Prioridad } from '../../common/enums.js';

@Entity('orden_trabajo')
export class OrdenTrabajo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column()
  vehiculo_id: number;

  @Column()
  cliente_id: number;

  @Column({ nullable: true })
  mecanico_id: number;

  @Column({ unique: true })
  numero_ot: string;

  @Column({ type: 'enum', enum: OtEstado, default: OtEstado.RECEPCION })
  estado: OtEstado;

  @Column({ length: 200, nullable: true })
  tipo_servicio: string;

  @Column({ type: 'int', nullable: true })
  km_ingreso: number;

  @Column({ length: 20, nullable: true })
  combustible_ing: string;

  @Column({ type: 'text', nullable: true })
  diagnostico: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_ingreso: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_prometida: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_entrega: Date;

  @Column({ type: 'enum', enum: Prioridad, default: Prioridad.MEDIA })
  prioridad: Prioridad;

  @Column({ type: 'uuid', nullable: true })
  token_portal: string;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  total: number;

  @Column({ nullable: true })
  firma_cliente_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Taller, (t) => t.ordenes_trabajo)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @ManyToOne(() => Vehiculo, (v) => v.ordenes_trabajo)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Relation<Vehiculo>;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Relation<Cliente>;

  @ManyToOne(() => Mecanico, { nullable: true })
  @JoinColumn({ name: 'mecanico_id' })
  mecanico: Relation<Mecanico>;

  @OneToMany(() => OtDetalle, (d) => d.orden_trabajo)
  detalles: Relation<OtDetalle[]>;

  @OneToMany(() => OtFoto, (f) => f.orden_trabajo)
  fotos: Relation<OtFoto[]>;

  @OneToMany(() => ChecklistRecepcion, (c) => c.orden_trabajo)
  checklist: Relation<ChecklistRecepcion[]>;
}
