import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import {Redis} from 'ioredis';
import { Request, Response } from "express";

export type HimpunContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;

  req: Request;

  res: Response;

  redis: Redis;
}