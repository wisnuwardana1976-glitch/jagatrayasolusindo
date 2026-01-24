import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkTableStructure() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        const tables = ['Items', 'Partners', 'PurchaseOrders', 'PurchaseOrderDetails', 'Receivings', 'ReceivingDetails', 'Shipments', 'ShipmentDetails', 'ARInvoices', 'APInvoices'];

        for (const table of tables) {
            console.log(`\n========== ${table} ==========`);
            try {
                const result = await conn.query(`
          SELECT c.column_name, d.domain_name as data_type, c.nulls
          FROM SYSCOLUMN c
          JOIN SYSTABLE t ON c.table_id = t.table_id
          JOIN SYSDOMAIN d ON c.domain_id = d.domain_id
          WHERE t.table_name = '${table}'
          ORDER BY c.column_id
        `);
                result.forEach(row => {
                    console.log(`  ${row.column_name}: ${row.data_type} ${row.nulls === 'Y' ? 'NULL' : 'NOT NULL'}`);
                });
            } catch (e) {
                console.log('Error:', e.message);
            }
        }

        await conn.close();
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTableStructure();
