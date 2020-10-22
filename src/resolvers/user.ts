import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { SyntaxErrorException} from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import { validate } from "class-validator";

import { HimpunContext } from "../types";
import { User } from "../entities/User";
import { FieldError } from "./errors";
import { COOKIE_NAME } from "../constant";
import { CredentialInput, NameInput, LoginInput } from "../input-types/user";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver(User)
export class UserResolver {
  /**
   * Handle getting the profile of the user
   * 
   * @param ctx the context of the application. It is automatically filled by apollo
   */
  @Query(() => User, {nullable: true})
  async profile(
    @Ctx() ctx: HimpunContext
  ): Promise<User | null> {
    if (!ctx.req.session!.userId) {
      return null;
    }

    const user = await ctx.em.findOne(User, {
      id: ctx.req.session!.userId,
    });

    return user;
  }

  @Mutation(() => UserResponse)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() ctx: HimpunContext,
  ): Promise<UserResponse> {
    console.log(ctx, email);
    return {};
  }

  /**
   * Handle registration for the user
   * @param credentials is the username and password
   * 
   * @param options argument is optional fields for the user class
   * @param ctx the context of the application. It is passed on automatically by apollo
   */
  @Mutation(() => UserResponse)
  async register(
    @Arg('credentials') credentials: CredentialInput,
    @Arg('options', { nullable: true }) options: NameInput,
    @Ctx() ctx: HimpunContext
  ): Promise<UserResponse> {
    // validate the credentials
    const validationErrors = await validate(credentials)
    if (validationErrors.length > 0) {
      const errors: FieldError[] = [];
      validationErrors.map((err) => {
        errors.push(FieldError.fromValidationError(err));
      });

      return {errors};
    }

    // Create user object to be validated and save
    let user = ctx.em.create(User, new User({
        username: credentials.username,
        email: credentials.email,
        firstname: options.firstname, 
        lastname: options.lastname
      })
    );

    // Generate necessary fields
    user.generateId();
    await user.generateHashedPassword(credentials.password);

    try {
      // Because the user object is created using KnexQuery
      // The object that is passed on to the insert should be created manually.
      // It's just not possible to give the `user` into the insert function
      const result = await (ctx.em as EntityManager).createQueryBuilder(User)
      .getKnexQuery().insert({
          id: user.id,
          username: user.username,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          password: user.password,
          firstname: user.firstname,
          lastname: user.lastname,
        })
        .returning("*");
        
      user = result[0];

    } catch(err: any) {
      const exceptionErr = err as SyntaxErrorException;
      if (exceptionErr && exceptionErr.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username has already been taken",
            }
          ]
        }
      }
    }

    // Store user ID session and keep them logged in
    ctx.req.session!.userId = user.id;

    return { user };
  }

  /**
   * Handle mutation for login
   * 
   * @param credentials username and password
   * @param ctx the context of the application. It is passed on automatically by apollo
   */
  @Mutation(() => UserResponse)
  async login(
    @Arg('credentials') credentials: LoginInput,
    @Ctx() ctx: HimpunContext
  ): Promise<UserResponse> {
    const validationErrors = await validate(credentials)
    if (validationErrors.length > 0) {
      const errors: FieldError[] = [];
      validationErrors.map((err) => {
        errors.push(FieldError.fromValidationError(err));
      });

      return {errors};
    }
    
    const searchOpt = credentials.usernameOrEmail.includes("@") ? { email: credentials.usernameOrEmail } : { username: credentials.usernameOrEmail };
    const user = await ctx.em.findOne(User, searchOpt);

    // Check if the user exists
    if (!user) {
      return {
        errors: [
          {
            message: "The username does not exist",
            field: "username",
          }
        ]
      };
    }

    // Check if password matched
    const isValid = await user.verifiedPassword(credentials.password);
    if (!isValid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          }
        ]
      };
    }

    // Store user ID session and keep them logged in
    ctx.req.session!.userId = user.id;

    return { user };
  }


  @Mutation(() => Boolean)
  logout (
    @Ctx() ctx: HimpunContext
  ) {
    return new Promise((resolve) => ctx.req.session?.destroy(err => {
      if (err) {
        console.log(err);
        resolve(false);
        return;
      }

      ctx.res.clearCookie(COOKIE_NAME);
      resolve(true);
    }))
  }
}