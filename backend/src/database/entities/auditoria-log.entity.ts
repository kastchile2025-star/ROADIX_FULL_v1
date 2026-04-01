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
import { Usuario } from './usuario.entity.js';

@Entity('auditoria_log')
export class AuditoriaLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ nullable: true })
  usuario_id: number;

  @Column({ length: 100 })
  accion: string;

  @Column({ length: 100 })
  entidad: string;

  @Column({ nullable: true })
  entidad_id: number;

  @Column({ type: 'jsonb', nullable: true })
  datos_antes: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  datos_despues: Record<string, unknown>;

  @Column({ length: 50, nullable: true })
  ip: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;
}
