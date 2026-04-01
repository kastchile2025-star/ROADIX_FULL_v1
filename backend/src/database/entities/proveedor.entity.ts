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

@Entity('proveedor')
export class Proveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taller_id: number;

  @Column({ length: 200 })
  razon_social: string;

  @Column({ length: 20, nullable: true })
  rut: string;

  @Column({ length: 200, nullable: true })
  contacto: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Taller, (t) => t.proveedores)
  @JoinColumn({ name: 'taller_id' })
  taller: Relation<Taller>;
}
