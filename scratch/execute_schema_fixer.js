const { DataSource } = require('typeorm');
const { fixProductionSchema } = require('../backend/dist/database/schema-fixer');

async function run() {
    const ds = new DataSource({
        type: 'postgres',
        host: '66.33.22.240',
        port: 45505,
        username: 'postgres',
        password: 'RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI',
        database: 'railway',
        ssl: { rejectUnauthorized: false },
        synchronize: false,
        logging: true,
        entities: []
    });

    try {
        await ds.initialize();
        console.log('Connected to Railway DB via TypeORM. Running schema-fixer...');
        await fixProductionSchema(ds);
        console.log('schema-fixer finished execution.');
    } catch (e) {
        console.error('Error running schema-fixer:', e);
    } finally {
        await ds.destroy();
    }
}
run();
