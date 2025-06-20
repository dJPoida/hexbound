import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePushSubscriptionTable1750403398781 implements MigrationInterface {
    name = 'CreatePushSubscriptionTable1750403398781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_a4993e50a3993a408bd0c6c1b48"`);
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh" character varying NOT NULL, "auth" character varying NOT NULL, CONSTRAINT "UQ_0008bdfd174e533a3f98bf9af16" UNIQUE ("endpoint"), CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4cc061875e9eecc311a94b3e43" ON "push_subscriptions" ("userId") `);
        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "statusId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName")`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_a4d8fc46ad2323a4fa4c65f1f0a" FOREIGN KEY ("statusId") REFERENCES "game_statuses"("statusId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" ADD CONSTRAINT "FK_4cc061875e9eecc311a94b3e431" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP CONSTRAINT "FK_4cc061875e9eecc311a94b3e431"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_a4d8fc46ad2323a4fa4c65f1f0a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59"`);
        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "statusId" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cc061875e9eecc311a94b3e43"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_a4993e50a3993a408bd0c6c1b48" FOREIGN KEY ("statusId") REFERENCES "game_statuses"("statusId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
