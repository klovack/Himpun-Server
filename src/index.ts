import { MikroORM } from "@mikro-orm/core";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

import { __prod__ } from "./constant";
import microConfig from './mikro-orm.config';
import { HelloResolver } from "./resolvers/hello";

const main = async () => {
  
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  // Example on how to create post. Might need it later
  // Create instance of post that is ready to be inserted into the database 
  // const post = orm.em.create(Post, new Post("My First Post"));
  // await orm.em.persistAndFlush(post);

  const app = express();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
    })
  });

  apolloServer.applyMiddleware({app});
  
  app.listen(3000, () => {
    console.log('Server started on localhost:3000');
  });
};

main().catch(err => {
  console.error(err);
});