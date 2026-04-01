import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Taller } from './taller.entity.js';

@Entity('mecanico')
export class Mecanico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  usuario_id: number;

  @Column()
  taller_id: number;

  @Column({ length: 200, nullable: true })
  especialidad: string;

  @Column({ type: 'decimal', precision: 10, scale: 0, default: 0 })
  tarifa_hora: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Usuario, (u) => u.mecanico)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Taller, (t) => t.mecanicos)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;
}
