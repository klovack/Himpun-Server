import { MikroORM } from "@mikro-orm/core";
import express from 'express';

import { __prod__ } from "./constant";
import { Post } from "./entities/Post";
import microConfig from './mikro-orm.config';

const main = async () => {
  
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  // Example on how to create post. Might need it later
  // Create instance of post that is ready to be inserted into the database 
  // const post = orm.em.create(Post, new Post("My First Post"));
  // await orm.em.persistAndFlush(post);
};

main().catch(err => {
  console.error(err);
});