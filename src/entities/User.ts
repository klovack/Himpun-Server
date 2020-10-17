import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Entity()
export class User {
  /**
   * Minimum length of the username
   */
  static USERNAME_MIN_LENGTH: number = 3;

  /**
   * Password validation using regex
   * 
   *  - at least 8 characters
   *  - must contain at least 1 uppercase letter, 1 lowercase letter and 1 number
   *  - can contain special characters
   */
  static PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
  
  @Field(() => String)
  @PrimaryKey({type: 'text', unique: true, onCreate: () => uuidv4()})
  id!: string;

  @Field(() => String)
  @Property({type: 'date'})
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field(() => String)
  @Property({type: 'text', unique: true})
  username!: string;

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
  constructor({username, firstname, lastname}: IUser) {
    this.username = username;
    
    this.firstname = firstname ? firstname : "";
    this.lastname = lastname ? lastname : "";
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
  async verifiedPassword(password: string): Promise<boolean> {
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
  password?: string;
  firstname?: string;
  lastname?: string;
}