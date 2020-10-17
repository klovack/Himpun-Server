import { MikroORM } from "@mikro-orm/core";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import redis from 'redis';
import session from 'express-session';
import connectRedis from "connect-redis";

import { __prod__ } from "./constant";
import microConfig from './mikro-orm.config';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { HimpunContext } from "./types";

const main = async () => {

  // Connect to redis
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();
  
  // Open connection to the database using mikro orm
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  // Example on how to create post. Might need it later
  // Create instance of post that is ready to be inserted into the database 
  // const post = orm.em.create(Post, new Post("My First Post"));
  // await orm.em.persistAndFlush(post);

  const app = express();

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
      secret: 'AJFS923klsankanfoqhf3@Q$(UJFOSklj3rfj',
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
  apolloServer.applyMiddleware({app});
  
  app.listen(3000, () => {
    console.log('Server started on localhost:3000');
  });
};

main().catch(err => {
  console.error(err);
});