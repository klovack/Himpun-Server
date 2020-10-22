import { __prod__ } from "../constant";

export class Config {
  port: number;
  sessionSecret: string;
  webURL: string;
  
  constructor() {
    if (!__prod__) {
      this.port = 4000;
      this.sessionSecret = "AJFS923klsankanfoqhf3@Q$(UJFOSklj3rfj";
      this.webURL = "http://localhost:3000";
    }
  }
}