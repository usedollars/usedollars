import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserPhoneNumber1755034585351 implements MigrationInterface {
    name = 'UpdateUserPhoneNumber1755034585351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" 
            DROP CONSTRAINT IF EXISTS "UQ_f2578043e491921209f5dadd080"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "user" 
            ALTER COLUMN "phoneNumber" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" 
            ALTER COLUMN "phoneNumber" SET NOT NULL
        `);
        
    }
}
