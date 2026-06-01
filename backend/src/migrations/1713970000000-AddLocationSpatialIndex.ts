import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationSpatialIndex1713970000000 implements MigrationInterface {
    name = 'AddLocationSpatialIndex1713970000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable postgis extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

        // Add geography column location to businesses table if not exists
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='location') THEN
                    ALTER TABLE "businesses" ADD COLUMN "location" geography(Point, 4326);
                END IF;
            END $$;
        `);

        // Create GIST spatial index on location if not exists
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_businesses_location" ON "businesses" USING gist("location");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_businesses_location";`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN IF EXISTS "location";`);
    }
}
