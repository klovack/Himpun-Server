import express from 'express';
import path from 'path';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema, registerEnumType } from 'type-graphql';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection, getConnectionOptions } from 'typeorm';

import { COOKIE_NAME, __prod__ } from "./constant";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { HimpunContext } from "./types";
import { Config } from "./config/config";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { Media, MediaType, registerMediaTypeEnum } from './entities/Media';

const main = async () => {
  // Connect to redis
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  // Registering all enum types
  registerEnumType(MediaType, registerMediaTypeEnum);

  const typeOrmConnectionOption = await getConnectionOptions();
  Object.assign(typeOrmConnectionOption, {
    entities: [
      User,
      Media,
      Post,
    ],
    migrations: [path.join(__dirname, './migrations/*')]
  })
  const typeOrmConnection = await createConnection(typeOrmConnectionOption);
  // await typeOrmConnection.runMigrations();

  if (!typeOrmConnection.isConnected) {
    await typeOrmConnection.connect();
  }
  
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
    context: ({req, res}): HimpunContext => ({ req, res, redis, config })
  });
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: config.webURL,
    }
  });
  
  app.listen(config.port, () => {
    console.log('Server started on localhost:' + config.port);
  });
};

main().catch(err => {
  console.error(err);
});