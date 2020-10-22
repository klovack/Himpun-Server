import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import {Redis} from 'ioredis';
import { Request, Response } from "express";
import { Config } from "./config/config";

export type HimpunContext = {
  config: Config;
  
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;

  req: Request;

  res: Response;

  redis: Redis;
}