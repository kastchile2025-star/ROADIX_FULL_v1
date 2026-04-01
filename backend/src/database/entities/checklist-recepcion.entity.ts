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
import { ZonaVehiculo, EstadoChecklist } from '../../common/enums.js';

@Entity('checklist_recepcion')
export class ChecklistRecepcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ot_id: number;

  @Column({ type: 'enum', enum: ZonaVehiculo })
  zona_vehiculo: ZonaVehiculo;

  @Column({ type: 'enum', enum: EstadoChecklist, default: EstadoChecklist.OK })
  estado: EstadoChecklist;

  @Column({ nullable: true })
  foto_url: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.checklist)
  @JoinColumn({ name: 'ot_id' })
  orden_trabajo: Relation<OrdenTrabajo>;
}
