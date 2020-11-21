import { isUUID, validate } from "class-validator";
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";

import { PostFilterInput, PostInput } from "../input-types/post";
import { Post } from "../entities/Post";
import { Media } from "../entities/Media";
import { HimpunContext } from "../types";
import { isAuth } from "../middlewares/isAuth";
import { User } from "../entities/User";

@Resolver(Post)
export class PostResolver {
  @Query(() => [Post])
  posts(
    @Arg('filter', () => PostFilterInput, {nullable: true}) filter?: PostFilterInput
  ): Promise<Post[]> {
    return Post.find({
      relations: ["author", "votes", "likes", "dislikes"],
      where: !!filter ? [filter?.toQuery()] : []
    });
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id', () => String) id: string): Promise<Post | null | undefined> {
    if (!isUUID(id)) {
      return undefined;
    }

    return Post.findOne(id, {relations: ["author", "votes", "likes", "dislikes"]})
    // return Post.findOne(id);
  }

  @Mutation(() => Post, {nullable: true})
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('data', () => PostInput) data: PostInput,
    @Ctx() ctx: HimpunContext,
    ): Promise<Post|null> {
    let errors = await validate(data);
    if (errors.length > 0) {
      console.log(errors);
      return null;
    }

    const featuredImage = await Media.findOne({where: {id: data.featuredImageId}});
    const author = await User.findOne(ctx.req.session?.userId);
    if (!author) {
      return null;
    }

    const post = new Post({
      ...data,
      featuredImage,
      author,
    });
    errors = await validate(post);
    if (errors.length > 0) {
      console.log(errors);
      return null;
    }

    return post.save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => String) id: string,
    @Arg('title', () => String, { nullable: true }) title: string
    ): Promise<Post | null> {

    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }

    if (typeof title !== "undefined") {
      try {
        await Post.update({ id }, {title});
      } catch (error) {
        return null;
      }
    }

    return post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => String) id: string
    ): Promise<boolean> {
      try {
        const del = await Post.delete(id);
        if (del.affected! > 0) {
          return true;
        }
        if (del.affected! <= 0) {
          return false;
        }
        
        return false;
      } catch (error) {
        return false;
      } 
  }
}