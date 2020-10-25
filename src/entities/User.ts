import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { IsEmail, IsString, MinLength, NotContains } from "class-validator";

@ObjectType()
@Entity()
export class User {
  /**
   * Minimum length of the username
   */
  static USERNAME_MIN_LENGTH: number = 3;

  /**
   * Length of the user id.
   */
  static USER_ID_LENGTH: number = 15;

  /**
   * Password validation using regex
   * 
   *  - at least 8 characters
   *  - must contain at least 1 uppercase letter, 1 lowercase letter and 1 number
   *  - can contain special characters
   */
  static PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
  
  @Field(() => String)
  @PrimaryKey({type: 'text', unique: true, onCreate: () => nanoid(User.USER_ID_LENGTH)})
  id!: string;

  @Field(() => String)
  @Property({type: 'date'})
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @IsString()
  @MinLength(User.USERNAME_MIN_LENGTH)
  @NotContains("@", {
    message: "username must not have @ symbol"
  })
  @Field(() => String)
  @Property({type: 'text', unique: true})
  username!: string;

  @Field(() => String)
  @IsEmail(undefined, {
    message: "email must be a valid email address"
  })
  @Property({type: 'text', unique: true})
  email!: string;

  @Property({type: "text"})
  password!: string;

  @Field(() => String, {nullable: true})
  @Property({type: 'text', nullable: true})
  firstname?: string;

  @Field(() => String, {nullable: true})
  @Property({type: 'text', nullable: true})
  lastname?: string;

  /**
   * This will only create the instance of the user without the password.
   * If you save this into the database it will fail because it has not password.
   * 
   * To create the password you need to call generateHashedPassword(password)
   * with the password as the argument. That function will create the hashed password
   * and set the instance's password to the hashed password. 
   * @param user username, firstname, lastname
   * @param generateId optional if you want to create new user with the id
   */
  constructor({username, email, firstname, lastname}: IUser) {
    this.username = username;
    this.email = email;
    
    this.firstname = firstname ? firstname : "";
    this.lastname = lastname ? lastname : "";
  }

  /**
   * Generate ID and assign it to the instance's id.
   * 
   * This function should only be created if the User's instance is not created
   * by Mikro ORM.
   * 
   * When creating User's instance using Mikro ORM, ID is automatically generated
   * using Mikro ORM Lifecycle Hooks.
   */
  generateId(additionalLength: number = 0) {
    this.id = nanoid(User.USER_ID_LENGTH + additionalLength);
  }
  
  /**
   * Hash the password and then store it into the instance's password
   * @param password plain text password
   */
  async generateHashedPassword(password: string) {
    const hashedPassword = await argon2.hash(password);
    this.password = hashedPassword;
  }

  /**
   * Verify the password arg with the instance's hashed password
   * @param password plain text password
   */
  async verifyPassword(password: string): Promise<boolean> {
    return await argon2.verify(this.password, password); 
  }

  /**
   * Check the validity of the username
   * @param username plain text username
   */
  static isValidUsername(username: string): boolean {
    // TODO Maybe do some validation with other libs
    return username.length >= User.USERNAME_MIN_LENGTH;
  }

  /**
   * Check validity of the password
   * @param password plain text password
   */
  static isValidPassword(password: string): boolean {
    return this.PASSWORD_REGEX.test(password);
  }
}

interface IUser {
  username: string;
  email: string,
  password?: string;
  firstname?: string;
  lastname?: string;
}