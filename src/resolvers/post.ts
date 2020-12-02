import { isUUID, validate } from "class-validator";
import { Arg, Ctx, Field, FieldResolver, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";

import { PostFilterInput, PostInput } from "../input-types/post";
import { Post } from "../entities/Post";
import { Media } from "../entities/Media";
import { HimpunContext } from "../types";
import { isAuth } from "../middlewares/isAuth";
import { User } from "../entities/User";
import { LessThan } from "typeorm";

@ObjectType()
class PostPaginationResponse {
  @Field(() => [Post])
  posts: Post[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  bodySnippet(
    @Root() root: Post
  ) {
    return root.body?.slice(0, 100);
  }
  
  @Query(() => PostPaginationResponse)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor?: string,
    @Arg('filter', () => PostFilterInput, {nullable: true}) filter?: PostFilterInput
  ): Promise<PostPaginationResponse> {
    const realLimit = Math.min(50, Math.max(0, limit));
    
    const allPosts = await Post.find({
      relations: ["author", "votes", "likes", "dislikes"],
      where: !!filter ? [filter?.toQuery(cursor)] : !!cursor ? [{
        createdAt: LessThan(new Date(parseInt(cursor)))
      }] : [],
      order: {
        createdAt: "DESC",
      },

      // +1 is to check whether there's more than post left.
      // e.g:
      //  limit = 10
      //  take = 11
      // if it found 11 posts, that means there's still posts in the database left.
      take: (realLimit + 1),
    });

    return {
      // return only until the `realLimit`
      posts: allPosts.slice(0, realLimit),

      // If the length of all the posts found is more than the limit,
      // that means the database has still more post.
      hasMore: allPosts.length > realLimit,
    };
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