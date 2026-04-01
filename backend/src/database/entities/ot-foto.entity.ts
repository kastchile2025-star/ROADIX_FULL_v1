import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity.js';
import { TipoFotoOt } from '../../common/enums.js';

@Entity('ot_foto')
export class OtFoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ot_id: number;

  @Column()
  url: string;

  @Column({ type: 'enum', enum: TipoFotoOt })
  tipo: TipoFotoOt;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.fotos)
  @JoinColumn({ name: 'ot_id' })
  orden_trabajo: Relation<OrdenTrabajo>;
}
