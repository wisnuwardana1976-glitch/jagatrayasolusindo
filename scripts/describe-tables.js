
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function describeTable(tableName) {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        // Using syscolumn and systable to get column info
        // Simple query to avoid complex joins if they are causing issues, but joins are standard
        const query = `
            SELECT c.column_name, d.domain_name, c.width, c.scale 
            FROM SYSCOLUMN c
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id
            JOIN SYSTABLE t ON c.table_id = t.table_id
            WHERE t.table_name = '${tableName}'
            ORDER BY c.column_id
        `;

        const columns = await connection.query(query);
        console.log(`\n=== STRUCTURE OF ${tableName} ===`);
        console.table(columns.map(c => ({
            name: c.column_name,
            type: c.domain_name,
            width: c.width,
            scale: c.scale
        })));

    } catch (error) {
        console.error(`Error describing ${tableName}:`, error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function run() {
    await describeTable('InventoryAdjustments');
    await describeTable('APAdjustments');
    await describeTable('ARAdjustments');
}

run();
