import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";

import { Post } from "../entities/Post";
import { HimpunContext } from "../types";

@Resolver(Post)
export class PostResolver {
  @Query(() => [Post])
  posts(@Ctx() ctx: HimpunContext): Promise<Post[]> {
    
    return ctx.em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  post(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: HimpunContext): Promise<Post | null> {
    
    return ctx.em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg('title', () => String) title: string,
    @Ctx() ctx: HimpunContext): Promise<Post> {

    const post = ctx.em.create(Post, {title});
    await ctx.em.persistAndFlush(post);
    
    return post;
  }

  @Mutation(() => Post, {nullable: true})
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Ctx() ctx: HimpunContext): Promise<Post | null> {
    
    const post = await ctx.em.findOne(Post, {id});
    if (!post) {
      return null;
    }

    if (typeof title !== "undefined") {
      post.title = title;
      await ctx.em.persistAndFlush(post);
    }
    
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: HimpunContext)
    : Promise<boolean> {
    try {
      await ctx.em.nativeDelete(Post, {id});
      return true;
    } catch {
      return false;
    }
  }
}