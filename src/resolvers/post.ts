import { validate } from "class-validator";
import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";

import { Post } from "../entities/Post";

@Resolver(Post)
export class PostResolver {
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find();
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => String) id: string): Promise<Post | null | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post, {nullable: true})
  async createPost(@Arg('title', () => String) title: string): Promise<Post|null> {
    const post = new Post({
      title,
    });
    const errors = await validate(post);
    if (errors.length > 0) {
      return null;
    }

    return post.save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => String) id: string,
    @Arg('title', () => String, { nullable: true }) title: string
    ): Promise<Post | null> {

    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }

    if (typeof title !== "undefined") {
      await Post.update({ id }, {title});
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id', () => Int) id: number
    ): Promise<boolean> {
      const del = await Post.delete(id);
      if (del.affected! > 0) {
        return true;
      }

      if(del.affected! <= 0) {
        return false;
      }

      return true;
  }
}