import "reflect-metadata";
import { DataSource } from "typeorm";
import config from "./config.js";
import { getModuleDir } from "@/shared/helpers/getModuleDir.helper.js";
import { User } from "./entities/User.entity.js";
import { Game } from "./entities/Game.entity.js";
import { GameStatus } from "./entities/GameStatus.entity.js";
import { PushSubscription } from "./entities/PushSubscription.entity.js";

// Export an uninitialized DataSource variable.
export let AppDataSource: DataSource;

export async function initializeDataSource(): Promise<DataSource> {
  const currentModuleDirname = getModuleDir(
    typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
  );

  // Create and assign the DataSource instance.
  AppDataSource = new DataSource({
    type: "postgres",
    host: config.postgres.host,
    port: config.postgres.port,
    username: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    synchronize: false,
    logging: ["error"],
    entities: [User, Game, GameStatus, PushSubscription],
    migrations: [`${currentModuleDirname}/migrations/*{.ts,.js}`],
    subscribers: [],
  });

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