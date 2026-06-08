import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCategoryMembers1748649600000 implements MigrationInterface {
  name = 'AddCategoryMembers1748649600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "category_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_category_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_category_members_user_category" UNIQUE ("user_id", "category_id"),
        CONSTRAINT "FK_cm_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cm_category" FOREIGN KEY ("category_id") REFERENCES "departments"("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`CREATE INDEX "IDX_cm_category_id" ON "category_members" ("category_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_cm_user_id" ON "category_members" ("user_id")`)

    // Migrate existing data: staff with department_id become members of that department
    await queryRunner.query(`
      INSERT INTO category_members (user_id, category_id)
      SELECT id AS user_id, department_id AS category_id
      FROM users
      WHERE department_id IS NOT NULL
        AND role IN ('manager', 'agent', 'team_leader')
        AND deleted_at IS NULL
      ON CONFLICT DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cm_user_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cm_category_id"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "category_members" CASCADE`)
  }
}
