import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddClientRating1748908800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS client_rating VARCHAR(10),
      ADD COLUMN IF NOT EXISTS client_rated_at TIMESTAMPTZ
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tickets
      DROP COLUMN IF EXISTS client_rating,
      DROP COLUMN IF EXISTS client_rated_at
    `)
  }
}
