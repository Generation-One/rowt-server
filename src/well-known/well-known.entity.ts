import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/users/user.entity';

@Entity('well_known_files')
export class WellKnownEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  filename: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 100, default: 'application/json' })
  contentType: string;

  @Column({ default: true })
  enabled: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
