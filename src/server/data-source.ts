import "reflect-metadata";
import { DataSource } from "typeorm";
import { getModuleDir } from "@/shared/helpers/getModuleDir.helper";
import { User } from "./entities/User.entity";
import { Game } from "./entities/Game.entity";
import { GameStatus } from "./entities/GameStatus.entity";

// The 'import.meta.url' argument is only available in ESM context.
// In a CJS context (like the production build), it will be undefined,
// and the helper will fall back to using __dirname.
const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  logging: ["error"],
  entities: [User, Game, GameStatus],
  migrations: [`${currentModuleDirname}/migrations/*{.ts,.js}`],
  subscribers: [],
}); 