import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Cliente } from './cliente.entity.js';
import { Taller } from './taller.entity.js';
import { OrdenTrabajo } from './orden-trabajo.entity.js';
import { TipoVehiculo, Combustible } from '../../common/enums.js';

@Entity('vehiculo')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cliente_id: number;

  @Column()
  taller_id: number;

  @Column({ length: 10 })
  patente: string;

  @Column({ length: 50, nullable: true })
  marca: string;

  @Column({ length: 50, nullable: true })
  modelo: string;

  @Column({ type: 'int', nullable: true })
  anio: number;

  @Column({ length: 30, nullable: true })
  color: string;

  @Column({ length: 20, nullable: true })
  vin: string;

  @Column({ type: 'enum', enum: TipoVehiculo, default: TipoVehiculo.AUTOMOVIL })
  tipo_vehiculo: TipoVehiculo;

  @Column({ type: 'int', default: 0 })
  km_actual: number;

  @Column({ type: 'enum', enum: Combustible, nullable: true })
  combustible: Combustible;

  @Column({ type: 'date', nullable: true })
  rev_tecnica: Date;

  @Column({ type: 'date', nullable: true })
  permiso_circ: Date;

  @Column({ type: 'date', nullable: true })
  soap_vence: Date;

  @Column({ nullable: true })
  foto_url: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Cliente, (c) => c.vehiculos)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Relation<Cliente>;

  @ManyToOne(() => Taller, (t) => t.vehiculos)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @OneToMany(() => OrdenTrabajo, (ot) => ot.vehiculo)
  ordenes_trabajo: Relation<OrdenTrabajo[]>;
}
