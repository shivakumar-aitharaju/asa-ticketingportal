"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddClientRating1748908800000 = void 0;
class AddClientRating1748908800000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS client_rating VARCHAR(10),
      ADD COLUMN IF NOT EXISTS client_rated_at TIMESTAMPTZ
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE tickets
      DROP COLUMN IF EXISTS client_rating,
      DROP COLUMN IF EXISTS client_rated_at
    `);
    }
}
exports.AddClientRating1748908800000 = AddClientRating1748908800000;
//# sourceMappingURL=1748908800000-AddClientRating.js.map