import { isUUID, validate } from "class-validator";
import { Arg, Ctx, Field, FieldResolver, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";

import { PostFilterInput, PostInput } from "../input-types/post";
import { Post, PostUpdateType } from "../entities/Post";
import { Media } from "../entities/Media";
import { HimpunContext } from "../types";
import { isAuth } from "../middlewares/isAuth";
import { User } from "../entities/User";
import { LessThan } from "typeorm";
import { FieldError } from "./errors";

@ObjectType()
class PostPaginationResponse {
  @Field(() => [Post])
  posts: Post[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@ObjectType()
class PostUpdateResponse {
  @Field(() => PostUpdateType)
  updateType: PostUpdateType;

  @Field(() => Boolean, { nullable: true })
  result?: boolean;

  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  bodySnippet(
    @Root() root: Post
  ) {
    return root.body?.slice(0, 100);
  }

  @FieldResolver(() => Int)
  votesCount(
    @Root() root: Post
  ) {
    return root.votes.length;
  }

  @FieldResolver(() => Int)
  likesCount(
    @Root() root: Post
  ) {
    return root.likes.length;
  }

  @FieldResolver(() => Int)
  dislikesCount(
    @Root() root: Post
  ) {
    return root.dislikes.length;
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

  @Mutation(() => PostUpdateResponse)
  async readPost(
    @Arg('postId', () => String) postId: string,
    @Ctx() ctx: HimpunContext,
  ): Promise<PostUpdateResponse> {
    // Check for the valid id
    if (!isUUID(postId)) {
      return {
        updateType: PostUpdateType.READ,
        errors: [
          {
            field: "postId",
            message: "Post ID is not valid uuid"
          }
        ]
      };
    }

    // Fetch the postItem based off of the postId and
    // return false if no post is associated with that id
    const postItem = await Post.findOne(postId);
    if (!postItem) {
      return {
        updateType: PostUpdateType.READ,
        errors: [
          {
            field: "post",
            message: "Post item is not found in the database"
          }
        ]
      };
    }
    
    // check if the reads is null, and create new one if it is.
    if (!postItem.reads || postItem.reads < 0) {
      postItem.reads = 0;
    }

    // add +1 to the reads.
    postItem.reads += 1;
    
    // save
    await postItem.save();

    return {
      result: true,
      updateType: PostUpdateType.READ
    };
  }

  /**
   * Vote the post will use the current login user and push that to the votes list
   * 
   * @param postId 
   * @param isUpvote 
   * @param ctx 
   * 
   * @returns `false` if the post or user doesn't exist or the user has canceled his vote.
   *  `true` if the user has successfully voted or is in the vote
   */
  @Mutation(() => PostUpdateResponse)
  async votePost(
    @Arg('postId', () => String) postId: string,
    @Arg('isUpvote', () => Boolean, {defaultValue: true}) isUpvote: boolean = true,
    @Ctx() ctx: HimpunContext,
  ): Promise<PostUpdateResponse> {
    // Check for the valid id
    if (!isUUID(postId)) {
      return {
        updateType: PostUpdateType.VOTE,
        errors: [
          {
            field: "postId",
            message: "Post ID is not valid uuid"
          }
        ]
      };
    }
    
    // Check for the valid userId
    const { userId } = ctx.req.session!;
    if (!userId) {
      return {
        updateType: PostUpdateType.VOTE,
        errors: [
          {
            field: "userId",
            message: "User is not logged in"
          }
        ]
      };
    }

    try {
      // Fetch the postItem based off of the postId and
      // return false if no post is associated with that id
      const postItem = await Post.findOne(postId, {relations: ["votes"]});
      if (!postItem) {
        return {
          updateType: PostUpdateType.VOTE,
          errors: [
            {
              field: "post",
              message: "Post item is not found in the database"
            }
          ]
        };
      }

      // Update the votes with the userId
      if (isUpvote) {
        if (!postItem.votes) {
          postItem.votes = [];
        }

        const hasVoted = !!postItem.votes.find((curUser) => {
          return curUser.id === userId;
        });

        if (hasVoted) {
          return {
            result: true,
            updateType: PostUpdateType.VOTE,
          };
        }

        const userObj = await User.findOne(userId);
        if (!userObj) {
          return {
            updateType: PostUpdateType.VOTE,
            errors: [
              {
                field: "user",
                message: "User is not found in the database"
              }
            ]
          };
        }

        postItem.votes.push(userObj);
      } else if (!!postItem.votes && postItem.votes.length > 0){
        let foundUserIdx = -1;
        postItem.votes.find((curUser, curIdx) => {
          if (curUser.id === userId) {
            foundUserIdx = curIdx;
            return true;
          }

          return false;
        });

        if (foundUserIdx >= 0) {
          postItem.votes.splice(foundUserIdx, 1);
          await postItem.save();
          return {
            result: false,
            updateType: PostUpdateType.VOTE,
          };
        }
      }
      await postItem.save();
  
      return {
        result: true,
        updateType: PostUpdateType.VOTE,
      };

    } catch (error) {
      console.log(error);
      
      return {
        updateType: PostUpdateType.VOTE,
        errors: [
          {
            field: "exception",
            message: error
          }
        ]
      };
    }
  }
}