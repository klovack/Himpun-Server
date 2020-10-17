import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

export type HimpunContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
}