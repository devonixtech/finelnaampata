import { DataSource } from "typeorm";
import { Affiliate } from "./src/entities/affiliate.entity";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

async function run() {
    const ds = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "your-db-host",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_DATABASE || "business_saas",
        entities: [Affiliate],
        synchronize: false,
    });

    try {
        await ds.initialize();
        const repo = ds.getRepository(Affiliate);
        const affiliate = await repo.findOne({ where: {} });
        console.log("REFERRAL_CODE:", affiliate?.referralCode);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await ds.destroy();
    }
}

run();
