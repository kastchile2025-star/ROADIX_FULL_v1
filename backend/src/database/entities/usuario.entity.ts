import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Taller } from './taller.entity.js';
import { Mecanico } from './mecanico.entity.js';
import { UserRole } from '../../common/enums.js';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 200, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VIEWER })
  rol: UserRole;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true })
  refresh_token: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller, (t) => t.usuarios)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @OneToOne(() => Mecanico, (m) => m.usuario)
  mecanico: Relation<Mecanico>;
}
