import "reflect-metadata";

import { DataSource, LogLevel } from "typeorm";

import { getModuleDir } from "@/shared/helpers/getModuleDir.helper.js";

import config from "./config.js";
import { Game } from "./entities/Game.entity.js";
import { GameStatus } from "./entities/GameStatus.entity.js";
import { PushSubscription } from "./entities/PushSubscription.entity.js";
import { User } from "./entities/User.entity.js";

const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
);

const ds = {
  type: "postgres" as const,
  host: config.postgres.host,
  port: config.postgres.port,
  username: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  synchronize: false,
  logging: ["error"] as LogLevel[],
  entities: [User, Game, GameStatus, PushSubscription],
  migrations: [`${currentModuleDirname}/migrations/*{.ts,.js}`],
  subscribers: [],
};

export const AppDataSource = new DataSource(ds);

export async function initializeDataSource(): Promise<DataSource> {
  // Initialize it and return it.
  await AppDataSource.initialize();
  return AppDataSource;
}

export function getDataSource(): DataSource {
  if (!AppDataSource) {
    throw new Error('DataSource has not been initialized.');
  }
  return AppDataSource;
} 