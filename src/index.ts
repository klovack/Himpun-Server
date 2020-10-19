import { MikroORM } from "@mikro-orm/core";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import redis from 'redis';
import session from 'express-session';
import connectRedis from "connect-redis";
import cors from "cors";

import { __prod__ } from "./constant";
import microConfig from './mikro-orm.config';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { HimpunContext } from "./types";

const config = {
  port: 4000,
  sessionSecret: 'AJFS923klsankanfoqhf3@Q$(UJFOSklj3rfj',
  corsOrigin: "http://localhost:3000",
}

const main = async () => {

  // Connect to redis
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();
  
  // Open connection to the database using mikro orm
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  app.use(cors({
    credentials: true,
    origin: config.corsOrigin,
  }));

  // Use Session with redis
  app.use(
    session({
      name: "qid",
      store: new RedisStore({ 
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 Years
        httpOnly: true,
        sameSite: 'lax', // cross site reference
        secure: __prod__, // Cookie only works on https
      },

      saveUninitialized: false,
      
      // TODO Hide the secret variable
      secret: config.sessionSecret,
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),

    // The apollo graphql needs to know the enitity from the entity manager
    context: ({req, res}): HimpunContext => ({ em: orm.em, req, res })
  });
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: "http://localhost:3000",
    }
  });
  
  app.listen(config.port, () => {
    console.log('Server started on localhost:' + config.port);
  });
};

main().catch(err => {
  console.error(err);
});