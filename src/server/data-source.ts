import "reflect-metadata";
import { DataSource } from "typeorm";
import { getModuleDir } from "@/shared/helpers/getModuleDir.helper";

const currentModuleDir = getModuleDir(import.meta.url);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [`${currentModuleDir}/entities/*.entity{.ts,.js}`],
  migrations: [`${currentModuleDir}/migrations/*{.ts,.js}`],
  subscribers: [],
}); 