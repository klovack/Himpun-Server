import { MiddlewareFn } from "type-graphql";

import { HimpunContext } from "../types";

export const isAuth: MiddlewareFn<HimpunContext> = ({context}, next) => {
  if (!context.req.session?.userId) {
    throw new Error("not authenticated");
  }

  return next();
}