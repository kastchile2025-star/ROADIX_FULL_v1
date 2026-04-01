import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Cliente } from './cliente.entity.js';
import { Vehiculo } from './vehiculo.entity.js';
import { OrdenTrabajo } from './orden-trabajo.entity.js';
import { Suscripcion } from './suscripcion.entity.js';
import { Mecanico } from './mecanico.entity.js';
import { Repuesto } from './repuesto.entity.js';
import { Proveedor } from './proveedor.entity.js';

@Entity('taller')
export class Taller {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 20, nullable: true })
  rut: string;

  @Column({ length: 500, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ type: 'jsonb', nullable: true })
  config_json: Record<string, unknown>;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Usuario, (u) => u.taller)
  usuarios: Relation<Usuario[]>;

  @OneToMany(() => Cliente, (c) => c.taller)
  clientes: Relation<Cliente[]>;

  @OneToMany(() => Vehiculo, (v) => v.taller)
  vehiculos: Relation<Vehiculo[]>;

  @OneToMany(() => OrdenTrabajo, (ot) => ot.taller)
  ordenes_trabajo: Relation<OrdenTrabajo[]>;

  @OneToMany(() => Suscripcion, (s) => s.taller)
  suscripciones: Relation<Suscripcion[]>;

  @OneToMany(() => Mecanico, (m) => m.taller)
  mecanicos: Relation<Mecanico[]>;

  @OneToMany(() => Repuesto, (r) => r.taller)
  repuestos: Relation<Repuesto[]>;

  @OneToMany(() => Proveedor, (p) => p.taller)
  proveedores: Relation<Proveedor[]>;
}
