import { validate, ValidationError } from "class-validator";

import { FieldError } from "../resolvers/errors";

export const validateGraphQLInput = async (data: any): Promise<FieldError[]> => {
  const validationErrors = await validate(data)
  if (validationErrors.length > 0) {
    const errors: FieldError[] = [];
    validationErrors.map((err: ValidationError) => {
      errors.push(FieldError.fromValidationError(err));
    });

    return errors;
  }

  return [];
}