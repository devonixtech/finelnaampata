import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlaggedForReviewToReview1713980000000 implements MigrationInterface {
    name = 'AddFlaggedForReviewToReview1713980000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='flagged_for_review') THEN
                    ALTER TABLE "reviews" ADD COLUMN "flagged_for_review" BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reviews_flagged_for_review" ON "reviews" ("flagged_for_review")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_flagged_for_review"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "flagged_for_review"`);
    }
}
