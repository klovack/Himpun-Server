import { __prod__ } from "../constant";
import devConfig from './config.dev.json';

export class Config {
  port: number;
  sessionSecret: string;
  webURL: string;
  
  constructor() {
    if (!__prod__) {
      return devConfig;
    }
  }
}