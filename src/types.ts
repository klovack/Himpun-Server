import {Redis} from 'ioredis';
import { Request, Response } from "express";
import { Config } from "./config/config";

export type HimpunContext = {
  config: Config;

  req: Request;

  res: Response;

  redis: Redis;
}