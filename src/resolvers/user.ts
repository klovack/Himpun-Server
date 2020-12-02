import { Arg, Ctx, Field, FieldResolver, Mutation, ObjectType, Query, Resolver, Root } from "type-graphql";
import { isEmail, validate } from "class-validator";

import { HimpunContext } from "../types";
import { User } from "../entities/User";
import { FieldError } from "./errors";
import { COOKIE_NAME } from "../constant";
import { CredentialInput, NameInput, LoginInput, ChangePasswordInput } from "../input-types/user";
import { sendEmail } from "../utils/sendEmail";
import { resetPasswordEmail } from "../utils/email-templates/reset-password";
import { deleteToken, getUserIdFromToken, isTokenValid, TokenType } from "../utils/token";
import { validateGraphQLInput } from "../utils/validate";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(
    @Root() user: User,
    @Ctx() ctx: HimpunContext,  
  ) {
    if (ctx.req.session?.userId === user.id) {
      return user.email;
    }

    return "";
  }
  
  /**
   * Handle getting the profile of the user
   * 
   * @param ctx the context of the application. It is automatically filled by apollo
   */
  @Query(() => User, {nullable: true})
  async profile(
    @Ctx() ctx: HimpunContext
  ): Promise<User | null | undefined> {
    if (!ctx.req.session!.userId) {
      return null;
    }

    return User.findOne(ctx.req.session!.userId, {relations: ["posts"]});
  }

  /**
   * Checks whether the token is valid
   * 
   * @param token which is given when user's request forgot password
   * @param ctx the context of the application. It is passed on automatically by apollo
   */
  @Query(() => Boolean)
  async tokenValid(
    @Arg("token") token: string,
    @Ctx() ctx: HimpunContext
  ): Promise<Boolean> {
    return await isTokenValid(TokenType.PASSWORD_TOKEN, ctx.redis, token);
  }

  /**
   * Handle change password.
   * Validate the token and then find the user based off of the token.
   * Set the password of the currently retrieved user to the new password.
   * 
   * @param data The token and new password
   * @param ctx the context of the application. It is passed on automatically by apollo
   */
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('data') data: ChangePasswordInput,
    @Ctx() ctx: HimpunContext,
  ): Promise<UserResponse> {
    // Validate the data which contains newPassword and the token
    const errors = await validateGraphQLInput(data);
    if (errors.length > 0) {
      return {
        errors,
      };
    }

    // Get the user id from redis store
    const userId = await getUserIdFromToken(TokenType.PASSWORD_TOKEN, ctx.redis, data.token)
    if (userId.length <= 0) {
      return {
        errors: [
          {
            field: "token",
            message: "token is invalid or expired"
          }
        ]
      }
    }

    // Find corresponding user for the user id
    const user = await User.findOne(userId);
    if (!user) {
      return {
        errors: [{
          field: "user",
          message: "user no longer exists"
        }]
      }
    }

    // Save the new password
    await user.generateHashedPassword(data.newPassword);

    await User.update(userId, {
      password: user.password,
    });
  
    await deleteToken(TokenType.PASSWORD_TOKEN, ctx.redis, data.token)

    // Login the user
    ctx.req.session!.userId = user.id;

    return {user};
  }

  /**
   * Handle the forgot password request
   * 
   * @param email User's email
   * @param ctx the context of the application. It is passed on automatically by apollo
   */
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() ctx: HimpunContext,
  ): Promise<Boolean> {
    if (!isEmail(email)) {
      return false;
    }

    const user = await User.findOne({ where: { email } });

    // For security reason: 
    // If email is not in the database, we can also return true
    // but don't send the forgot password email
    // to avoid phishing the email on our server.
    // But here we return true for better user experience
    if (!user) {
      return false;
    }

    await sendEmail(email, resetPasswordEmail(ctx, user))
    
    return true;
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
    const errors = await validateGraphQLInput(credentials);
    if (errors.length > 0) {
      return { errors };
    }

    // Create user object to be validated and save
    let user = new User({
      username: credentials.username,
      email: credentials.email,
      firstname: options.firstname,
      lastname: options.lastname,
    });

    // Generate password
    await user.generateHashedPassword(credentials.password);

    // Validate the user
    const valErrors = await validate(user);
    if (valErrors.length > 0) {
      return { errors: FieldError.fromValidationErrors(valErrors) };
    }

    try {
      await user.save();
    } catch(exceptionErr: any) {
      if (exceptionErr) {
        if (exceptionErr.code === "23505") {
          return {
            errors: [{
              field: "username",
              message: "username has already been taken",
            }]
          }
        } else {
          return {
            errors: [{
              field: "server",
              message: "there has been an error on the server"
            }]
          }
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
    const errors = await validateGraphQLInput(credentials);
    if (errors.length > 0) {
      return { errors };
    }
    
    const isSearchingByEmail = credentials.usernameOrEmail.includes("@");
    const searchBy = isSearchingByEmail ? "email" : "username";
    const searchOpt = isSearchingByEmail ? { email: credentials.usernameOrEmail } : { username: credentials.usernameOrEmail };
    const user = await User.findOne({ where: searchOpt });

    // Check if the user exists
    if (!user) {
      return {
        errors: [
          {
            message: `The ${searchBy} does not exist`,
            field: searchBy,
          }
        ]
      };
    }

    // Check if password matched
    const isValid = await user.verifyPassword(credentials.password);
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
        resolve(false);
        return;
      }

      ctx.res.clearCookie(COOKIE_NAME);
      resolve(true);
    }))
  }
}