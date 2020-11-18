import { IsDate, ValidateIf } from "class-validator";
import { Field, InputType } from "type-graphql";

/**
 * TimespanInput class contains optional properties:
 * 
 *  - timeStart
 *  - timeEnd
 */
@InputType()
export class TimespanInput {

  /**
   * The start of the timespan.
   * 
   * It is optional, but it will be validated if not null
   */
  @ValidateIf((d) => !!d)
  @IsDate()
  @Field(() => Date, {nullable: true})
  timeStart?: Date

  /**
   * The end of the time span.
   * 
   * It is optional, but it will be validated if not null
   */
  @ValidateIf((d) => !!d)
  @IsDate()
  @Field(() => Date, {nullable: true})
  timeEnd?: Date
}