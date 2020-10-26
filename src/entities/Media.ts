import { IsString, IsUrl } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

export interface MediaOptions {
  name?: string;
  url: string;
}

export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  PDF = 'pdf',
}

export const registerMediaTypeEnum = {
  name: 'MediaType',
  description: 'Avalable types for media entities'
}

@ObjectType()
@Entity()
export class Media extends BaseEntity {

  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @IsString()
  @Field(() => String)
  @Column({ type: 'text' })
  name?: string;

  @IsUrl()
  @Field(() => String) 
  @Column({ type: 'text' })
  url!: string;

  @Field(() => MediaType)
  @Column({ type: "enum", enum: MediaType, default: MediaType.IMAGE })
  mediaType!: MediaType;

  @Field(() => String)
  @Column()
  authorId: string;

  @ManyToOne(() => User, user => user.medias)
  author: User;

  constructor(options?: MediaOptions) {
    super();
    if (options) {
      this.name = options.name;
      this.url = options.url;
    }
  }
}