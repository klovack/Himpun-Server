import { MikroORM } from "@mikro-orm/core";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from "connect-redis";
import cors from "cors";

import { COOKIE_NAME, __prod__ } from "./constant";
import microConfig from './mikro-orm.config';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { HimpunContext } from "./types";
import { Config } from "./config/config";

const main = async () => {
  // Connect to redis
  const RedisStore = connectRedis(session);
  const redis = new Redis();
  
  // Open connection to the database using mikro orm
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  
  const app = express();
  const config = new Config();

  app.use(cors({
    credentials: true,
    origin: config.webURL,
  }));

  // Use Session with redis
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ 
        client: redis,
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
    context: ({req, res}): HimpunContext => ({ em: orm.em, req, res, redis, config })
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