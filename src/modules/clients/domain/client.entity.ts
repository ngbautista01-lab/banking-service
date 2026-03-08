import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientStatus } from './client.types';

registerEnumType(ClientStatus, {
  name: 'ClientStatus',
});

@ObjectType('Client')
@Entity({ name: 'clients' })
export class ClientEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ name: 'first_name', length: 80 })
  firstName!: string;

  @Field()
  @Column({ name: 'last_name', length: 80 })
  lastName!: string;

  @Field()
  @Column({ unique: true, length: 120 })
  email!: string;

  @Field()
  @Column({ name: 'document_number', unique: true, length: 25 })
  documentNumber!: string;

  @Field()
  @Column({ length: 20 })
  phone!: string;

  @Field(() => ClientStatus)
  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE,
  })
  status!: ClientStatus;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
