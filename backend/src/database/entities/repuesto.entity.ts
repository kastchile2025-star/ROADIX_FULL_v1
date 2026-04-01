import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Taller } from './taller.entity.js';
import { Proveedor } from './proveedor.entity.js';

@Entity('repuesto')
export class Repuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ nullable: true })
  proveedor_id: number;

  @Column({ length: 50, nullable: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 100, nullable: true })
  categoria: string;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  precio_compra: number;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  precio_venta: number;

  @Column({ type: 'int', default: 0 })
  stock_actual: number;

  @Column({ type: 'int', default: 0 })
  stock_minimo: number;

  @Column({ length: 100, nullable: true })
  ubicacion_bodega: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller, (t) => t.repuestos)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Relation<Proveedor>;
}
