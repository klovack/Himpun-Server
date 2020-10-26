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

  @Field(() => String)
  @Column({ type: 'text' })
  body: string;

  @Field(() => Media)
  @ManyToOne(() => Media)
  @JoinColumn({ name: "featured_image_id" })
  featuredImage: Media;

  @Field(() => String)
  @Column()
  authorId: string;

  @ManyToOne(() => User, user => user.posts, {cascade: true})
  author: User;

  @ManyToMany(() => User, user => user.votedPosts, { cascade: true })
  votes: User[];

  @ManyToMany(() => User, user => user.likedPosts, { cascade: true })
  likes: User[];

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