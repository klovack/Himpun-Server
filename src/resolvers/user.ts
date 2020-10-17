import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import {SyntaxErrorException} from "@mikro-orm/core";

import { HimpunContext } from "src/types";
import { User } from "../entities/User";
import { FieldError } from "./errors";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@InputType()
class NameInput {
  @Field()
  firstname: string

  @Field()
  lastname: string
}

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
   * Handle registration for the user
   * @param credentials is the username and password
   * 
   * @param options argument is optional fields for the user class
   * @param ctx the context of the application. It is passed on automatically by apollo
   */
  @Mutation(() => UserResponse)
  async register(
    @Arg('credentials') credentials: UsernamePasswordInput,
    @Arg('options', { nullable: true }) options: NameInput,
    @Ctx() ctx: HimpunContext
  ): Promise<UserResponse> {
    if (!User.isValidUsername(credentials.username)) {
      return {
        errors: [{
          field: "username",
          message: "Username is invalid",
        }]
      }
    }

    if (!User.isValidPassword(credentials.password)) {
      return {
        errors: [{
          field: "password",
          message: "Password is invalid",
        }]
      }
    }

    const user = ctx.em.create(User, new User({
        username: credentials.username,
        firstname: options.firstname, 
        lastname: options.lastname
      })
    );

    await user.generateHashedPassword(credentials.password);

    try {
      await ctx.em.persistAndFlush(user);
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
    @Arg('credentials') credentials: UsernamePasswordInput,
    @Ctx() ctx: HimpunContext
  ): Promise<UserResponse> {
    const user = await ctx.em.findOne(User, {
      username: credentials.username
    });

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

    console.log(user);

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

    return { user };
  }
}