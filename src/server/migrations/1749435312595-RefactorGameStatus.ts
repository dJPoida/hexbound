import { MigrationInterface, QueryRunner } from "typeorm";
import { GameStatusValues } from "../entities/GameStatus.entity";

export class RefactorGameStatus1749435312595 implements MigrationInterface {
    name = 'RefactorGameStatus1749435312595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the new table for statuses
        await queryRunner.query(`CREATE TABLE "game_statuses" ("statusId" SERIAL NOT NULL, "statusName" character varying NOT NULL, CONSTRAINT "UQ_f12c1e8a600632a79d85752c018" UNIQUE ("statusName"), CONSTRAINT "PK_4683075a034262453e9944357c9" PRIMARY KEY ("statusId"))`);

        // 2. Seed the new table with our status values
        await queryRunner.query(`INSERT INTO "game_statuses" ("statusName") VALUES ('${GameStatusValues.WAITING}'), ('${GameStatusValues.ACTIVE}'), ('${GameStatusValues.FINISHED}')`);

        // 3. Add the new foreign key column to the 'games' table
        await queryRunner.query(`ALTER TABLE "games" ADD "statusId" integer`);

        // 4. Set the default value for all existing rows
        const waitingStatus = await queryRunner.query(`SELECT "statusId" FROM "game_statuses" WHERE "statusName" = '${GameStatusValues.WAITING}'`);
        const waitingStatusId = waitingStatus[0].statusId;
        await queryRunner.query(`UPDATE "games" SET "statusId" = ${waitingStatusId}`);

        // 5. Now that all rows have a value, drop the old 'status' column
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "status"`);
        
        // 6. Make the new 'statusId' column NOT NULL
        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "statusId" SET NOT NULL`);

        // 7. Add the foreign key constraint
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_a4993e50a3993a408bd0c6c1b48" FOREIGN KEY ("statusId") REFERENCES "game_statuses"("statusId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverses the 'up' migration in the correct order
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_a4993e50a3993a408bd0c6c1b48"`);
        await queryRunner.query(`ALTER TABLE "games" ADD "status" character varying NOT NULL DEFAULT 'waiting'`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "statusId"`);
        await queryRunner.query(`DROP TABLE "game_statuses"`);
    }
}
