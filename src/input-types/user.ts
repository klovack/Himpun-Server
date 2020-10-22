import { IsEmail, IsString, Matches, MinLength, NotContains } from "class-validator";
import { User } from "../entities/User";
import { InputType, Field } from "type-graphql";

@InputType()
export class CredentialInput {
  @IsString()
  @MinLength(User.USERNAME_MIN_LENGTH)
  @NotContains("@", {
    message: "username must not have @ symbol"
  })
  @Field()
  username: string;

  @Matches(User.PASSWORD_REGEX, {
    message: "password must have min 8 characters, one lowercase, one uppercase, one special character and one number"
  })
  @Field()
  password: string;

  @IsEmail(undefined, {
    message: "email must be a valid email address"
  })
  @Field()
  email: string;
}

@InputType()
export class LoginInput {
  @IsString()
  @MinLength(User.USERNAME_MIN_LENGTH)
  @Field()
  usernameOrEmail: string;
  @Field()
  password: string;
}

@InputType()
export class NameInput {
  @IsString()
  @Field()
  firstname: string

  @IsString()
  @Field()
  lastname: string
}