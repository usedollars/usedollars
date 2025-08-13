import {MigrationInterface, QueryRunner} from "typeorm";

export class FixPhoneNumberNullable1755035205585 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" 
            ALTER COLUMN "phoneNumber" DROP NOT NULL,
            ALTER COLUMN "phoneNumber" DROP DEFAULT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" 
            ALTER COLUMN "phoneNumber" SET NOT NULL,
            ALTER COLUMN "phoneNumber" SET DEFAULT ''
        `);
    }
}
