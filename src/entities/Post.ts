import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
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

  @Field(() => Media, {nullable: true})
  @ManyToOne(() => Media)
  @JoinColumn({ name: "featured_image_id" })
  featuredImage?: Media;

  @Field(() => User)
  @ManyToOne(() => User, user => user.posts, {cascade: true})
  author: User;

  @Field(() => [User], { defaultValue: [] })
  @ManyToMany(() => User, user => user.votedPosts, { cascade: true })
  votes: User[];

  @Field(() => [User], { defaultValue: [] })
  @ManyToMany(() => User, user => user.likedPosts, { cascade: true })
  likes: User[];

  constructor(options?: PostOptions) {
    super();
    if (options) {
      this.title = options.title;
      this.body = options.body;
      this.featuredImage = options.featuredImage;
      this.author = options.author;
    }
  }
}

export interface PostOptions {
  title: string,
  body?: string,
  featuredImage?: Media,
  author: User,
}