import {Redis} from "ioredis";
import { v4 } from "uuid";

import { FORGOT_PASSWORD_PREFIX } from "../constant";

export enum TokenType {
  NONE,
  PASSWORD_TOKEN,
}

/**
 * Generate token according to the TokenType
 * 
 * @param tokenType The type of the token
 * @param redis IORedis instance to save the token in redis
 * @param userId User Id of the user. It's always necessary to point the token to the id
 */
export const generateToken = (tokenType: TokenType, redis: Redis, userId: string): string => {
  const token = v4();
  switch (tokenType) {
    case TokenType.PASSWORD_TOKEN:
      redis.set(FORGOT_PASSWORD_PREFIX + token, userId, "EX", 1000 * 60 * 60 * 24); // 1 day
      break;
  
    default:
      break;
  }
  
  return token;
}

export const isTokenValid = async (redis: Redis, token: string): Promise<Boolean> => {
  const redisToken = await redis.get(FORGOT_PASSWORD_PREFIX + token);
  if (!redisToken || redisToken.length <= 0) {
    return false;
  }

  return true;
}