import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Media } from "./Media";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {

  @Field(() => String)
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

  @Field(() => String, { nullable: true })
  @Column({ type: 'text' })
  body?: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ type: 'bool'})
  isPublished: boolean;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ type: "int", nullable: true })
  reads: number;

  @Field(() => Media, {nullable: true})
  @ManyToOne(() => Media)
  @JoinColumn({ name: "featured_image_id" })
  featuredImage?: Media;

  @Field(() => User)
  @ManyToOne(() => User, user => user.posts, {cascade: true})
  author: User;

  @Field(() => [User], { defaultValue: [] })
  @ManyToMany(() => User)
  @JoinTable()
  votes: User[];

  @Field(() => [User], { defaultValue: [] })
  @ManyToMany(() => User)
  @JoinTable()
  likes: User[];

  @Field(() => [User], { defaultValue: [] })
  @ManyToMany(() => User)
  @JoinTable()
  dislikes: User[];

  constructor(options?: PostOptions) {
    super();
    if (options) {
      this.title = options.title;
      this.body = options.body;
      this.featuredImage = options.featuredImage;
      this.author = options.author;
      this.isPublished = options.isPublished ? options.isPublished : false;
    }
  }
}

export interface PostOptions {
  title: string,
  body?: string,
  featuredImage?: Media,
  author: User,
  isPublished?: boolean,
}