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
import { TipoEmail, EstadoEmail } from '../../common/enums.js';

@Entity('historial_email')
export class HistorialEmail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ length: 200 })
  destinatario: string;

  @Column({ length: 500 })
  asunto: string;

  @Column({ type: 'enum', enum: TipoEmail })
  tipo: TipoEmail;

  @Column({ length: 100, nullable: true })
  template_usado: string;

  @Column({ type: 'jsonb', nullable: true })
  variables_json: Record<string, unknown>;

  @Column({ type: 'enum', enum: EstadoEmail, default: EstadoEmail.ENVIADO })
  estado: EstadoEmail;

  @Column({ nullable: true })
  sendgrid_id: string;

  @Column({ type: 'timestamp', nullable: true })
  abierto_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;
}
