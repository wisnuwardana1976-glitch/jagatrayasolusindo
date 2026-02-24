import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

const tables = [
    'PurchaseOrders',
    'SalesOrders',
    'Receivings',
    'APInvoices',
    'ARInvoices',
    'APAdjustments',
    'ARAdjustments',
    'InventoryAdjustments'
];

async function addExchangeRateColumn() {
    let conn;
    try {
        const pool = await odbc.pool(connectionString);
        conn = await pool.connect();

        console.log('Adding exchangerate_id column to transaction tables...\n');

        for (const table of tables) {
            try {
                await conn.query(`ALTER TABLE ${table} ADD exchangerate_id INTEGER NULL`);
                console.log(`✅ ${table} — exchangerate_id column added`);
            } catch (e) {
                const msg = e.odbcErrors ? e.odbcErrors[0].message : e.message;
                if (msg.includes('already exists') || msg.includes('Column')) {
                    console.log(`⏭️  ${table} — column already exists, skipping`);
                } else {
                    console.log(`❌ ${table} — Error: ${msg}`);
                }
            }
        }

        await conn.close();
        await pool.close();
        console.log('\n✅ Migration complete!');
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

addExchangeRateColumn();
