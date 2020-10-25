import {Redis} from "ioredis";
import { nanoid } from 'nanoid';

import { FORGOT_PASSWORD_PREFIX } from "../constant";

export enum TokenType {
  NONE,
  PASSWORD_TOKEN,
}

export interface tokenOptions {
  expireTime?: number;
  saveInRedis?: boolean;
}

export const defaultTokenOptions: tokenOptions = {
  expireTime: 1000 * 60 * 60 * 24, // 1 day
  saveInRedis: true,
}

/**
 * Generate token according to the TokenType
 * 
 * @param tokenType The type of the token
 * @param redis IORedis instance to save the token in redis
 * @param userId User Id of the user. It's always necessary to point the token to the id
 */
export const generateToken = (tokenType: TokenType, redis: Redis, userId: string, options = defaultTokenOptions): string => {
  const token = nanoid();

  if (options.saveInRedis) {
    switch (tokenType) {
      case TokenType.PASSWORD_TOKEN:
        redis.set(FORGOT_PASSWORD_PREFIX + token, userId, "EX", options.expireTime);
        break;
    
      default:
        redis.set(token, userId, "EX", options.expireTime);
        break;
    }
  }
  
  return token;
}

export const isTokenValid = async (tokenType: TokenType, redis: Redis, token: string): Promise<Boolean> => {
  const isValidToken = await getUserIdFromToken(tokenType, redis, token);
  return !!isValidToken && isValidToken.length > 0;
}

export const getUserIdFromToken = async (tokenType: TokenType, redis: Redis, token: string): Promise<string> => {
  switch (tokenType) {
    case TokenType.PASSWORD_TOKEN:
      const redisToken = await redis.get(FORGOT_PASSWORD_PREFIX + token);
      if (!redisToken || redisToken.length <= 0) {
        return "";
      }
      return redisToken;
      
    default:
      break;
  }

  return "";
}

export const deleteToken = async (tokenType: TokenType, redis: Redis, token: string): Promise<boolean> => {
  switch (tokenType) {
    case TokenType.PASSWORD_TOKEN:
      const redisToken = await redis.del(FORGOT_PASSWORD_PREFIX + token);
      if (!redisToken || redisToken <= 0) {
        return false;
      }
      return true;
      
    default:
      break;
  }

  return false;
}