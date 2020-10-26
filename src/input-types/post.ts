import { IsString, IsUUID, ValidateIf } from "class-validator"
import { InputType, Field } from "type-graphql"

@InputType()
export class PostInput {
  @IsString()
  @Field()
  title!: string;

  @IsString()
  @Field(() => String, {nullable: true})
  body?: string;

  @ValidateIf((fid) => fid && fid.length > 0)
  @IsUUID()
  @Field(() => String, { nullable: true })
  featuredImageId?: String;
}
