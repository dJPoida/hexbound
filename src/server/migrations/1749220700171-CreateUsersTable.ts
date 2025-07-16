import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1749220700171 implements MigrationInterface {
  name = 'CreateUsersTable1749220700171';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("userId" uuid NOT NULL DEFAULT uuid_generate_v4(), "userName" character varying(20) NOT NULL, CONSTRAINT "PK_8bf09ba754322ab9c22a215c919" PRIMARY KEY ("userId"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
