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
import { Cliente } from './cliente.entity.js';
import { Vehiculo } from './vehiculo.entity.js';
import {
  TipoRecordatorio,
  CanalRecordatorio,
  EstadoRecordatorio,
} from '../../common/enums.js';

@Entity('recordatorio')
export class Recordatorio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ nullable: true })
  cliente_id: number;

  @Column({ nullable: true })
  vehiculo_id: number;

  @Column({ type: 'enum', enum: TipoRecordatorio })
  tipo: TipoRecordatorio;

  @Column({ type: 'text', nullable: true })
  mensaje: string;

  @Column({ type: 'timestamp' })
  fecha_envio: Date;

  @Column({ type: 'enum', enum: CanalRecordatorio, default: CanalRecordatorio.EMAIL })
  canal: CanalRecordatorio;

  @Column({ type: 'enum', enum: EstadoRecordatorio, default: EstadoRecordatorio.PENDIENTE })
  estado: EstadoRecordatorio;

  @Column({ type: 'timestamp', nullable: true })
  enviado_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Relation<Cliente>;

  @ManyToOne(() => Vehiculo, { nullable: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Relation<Vehiculo>;
}
