import { ValidationError } from "class-validator";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;

  static fromValidationError(error: ValidationError): FieldError {
    return {
      field: error.property,
      message: Object.keys(error.constraints!).map((key) => error.constraints![key]).join(". "),
    };
  }
}