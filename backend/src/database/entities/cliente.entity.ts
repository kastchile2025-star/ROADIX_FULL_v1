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
import { Taller } from './taller.entity.js';
import { Vehiculo } from './vehiculo.entity.js';
import { TipoCliente } from '../../common/enums.js';

@Entity('cliente')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 20, nullable: true })
  rut: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 500, nullable: true })
  direccion: string;

  @Column({ type: 'enum', enum: TipoCliente, default: TipoCliente.PERSONA })
  tipo: TipoCliente;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller, (t) => t.clientes)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @OneToMany(() => Vehiculo, (v) => v.cliente)
  vehiculos: Relation<Vehiculo[]>;
}
