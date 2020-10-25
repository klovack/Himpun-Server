import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
@Entity()
export class Post extends BaseEntity {

  @Field(() => Int)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @Column({ type: 'text' })
  title!: string;

  constructor(options?: PostOptions) {
    super();
    if (options) {
      this.title = options.title;
    }
  }
}

export interface PostOptions {
  title: string;
}