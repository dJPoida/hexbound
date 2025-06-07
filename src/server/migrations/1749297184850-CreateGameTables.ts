import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameTables1749297184850 implements MigrationInterface {
    name = 'CreateGameTables1749297184850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "games" ("gameId" uuid NOT NULL DEFAULT uuid_generate_v4(), "gameCode" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'waiting', "currentTurn" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_7b6dbcdbcde7e71b78d3e4c0e91" UNIQUE ("gameCode"), CONSTRAINT "PK_8595e49a5ac9e19f2ce4c39f3b3" PRIMARY KEY ("gameId"))`);
        await queryRunner.query(`CREATE TABLE "game_players" ("game_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_1614d9019746c797c36651748d1" PRIMARY KEY ("game_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_67b26bf4c76bd09a206d504824" ON "game_players" ("game_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9adcb616544097a980720bbcc" ON "game_players" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "game_players" ADD CONSTRAINT "FK_67b26bf4c76bd09a206d504824b" FOREIGN KEY ("game_id") REFERENCES "games"("gameId") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "game_players" ADD CONSTRAINT "FK_b9adcb616544097a980720bbcc6" FOREIGN KEY ("user_id") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_players" DROP CONSTRAINT "FK_b9adcb616544097a980720bbcc6"`);
        await queryRunner.query(`ALTER TABLE "game_players" DROP CONSTRAINT "FK_67b26bf4c76bd09a206d504824b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9adcb616544097a980720bbcc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67b26bf4c76bd09a206d504824"`);
        await queryRunner.query(`DROP TABLE "game_players"`);
        await queryRunner.query(`DROP TABLE "games"`);
    }

}
