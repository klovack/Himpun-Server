import { IsBoolean, IsString, IsUUID, ValidateIf } from "class-validator"
import { InputType, Field } from "type-graphql"
import { Between, FindOperator, In, LessThanOrEqual, Like, MoreThanOrEqual } from "typeorm";
import { TimespanInput } from "./util";

@InputType()
export class PostInput {
  @IsString()
  @Field()
  title!: string;

  @IsString()
  @Field(() => String, { nullable: true })
  body?: string;

  @ValidateIf((fid) => fid && fid.length > 0)
  @IsUUID()
  @Field(() => String, { nullable: true })
  featuredImageId?: String;

  @ValidateIf((s) => s !== undefined || s !== null )
  @IsBoolean()
  @Field(() => Boolean, { defaultValue: false })
  isPublished?: boolean;
}

@InputType()
export class PostFilterInput {
  @ValidateIf((s) => !!s && s.length > 0)
  @IsUUID()
  @Field(() => String, { nullable: true })
  author?: string;

  @ValidateIf((s) => s !== undefined || s !== null )
  @IsBoolean()
  @Field(() => Boolean, { nullable: true })
  isPublished?: boolean;

  @ValidateIf((s) => !!s && s.length > 0)
  @IsUUID()
  @Field(() => String, { nullable: true })
  votes?: string;

  @ValidateIf((s) => !!s && s.length > 0)
  @IsUUID()
  @Field(() => String, { nullable: true })
  likes?: string;

  @ValidateIf((s) => !!s && s.length > 0)
  @IsUUID()
  @Field(() => String, { nullable: true })
  dislikes?: string;

  @ValidateIf((s) => !!s && s.length > 0)
  @IsString()
  @Field(() => String, { nullable: true })
  searchableWord?: string;

  @Field(() => TimespanInput, { nullable: true })
  timespan?: TimespanInput;

  toQuery(): {
    author?: string,
    votes?: FindOperator<string | undefined>,
    dislikes?: FindOperator<string | undefined>,
    likes?: FindOperator<string | undefined>,
    title?: FindOperator<string>,
    createdAt?: FindOperator<Date | undefined>,
    isPublished?: Boolean,
  } {
    let result: {
      author?: string,
      votes?: FindOperator<string | undefined>,
      dislikes?: FindOperator<string | undefined>,
      likes?: FindOperator<string | undefined>,
      title?: FindOperator<string>,
      createdAt?: FindOperator<Date | undefined>,
      isPublished?: Boolean,
    } = {};

    if (!!this.author) {
      result.author = this.author;
    }

    if (!!this.votes) {
      result.votes = In([this.votes]);
    }

    if (!!this.dislikes) {
      result.dislikes = In([this.dislikes]);
    }

    if (!!this.dislikes) {
      result.likes = In([this.likes]);
    }

    if (!!this.searchableWord) {
      result.title = Like(`%${this.searchableWord}%`);
    }

    if (this.isPublished !== undefined) {
      result.isPublished = this.isPublished;
    }

    if (!!this.timespan) {
      if (!!this.timespan.timeStart && !!this.timespan.timeEnd) {
        result.createdAt = Between(this.timespan.timeStart, this.timespan.timeEnd);
      } else if (!!this.timespan.timeStart) {
        result.createdAt = MoreThanOrEqual(this.timespan.timeStart);
      } else if (!!this.timespan.timeEnd) {
        result.createdAt = LessThanOrEqual(this.timespan.timeEnd);
      }
    }

    return result;
  }
}