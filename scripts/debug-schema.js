import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        const tables = ['PurchaseOrders', 'Partners'];

        for (const table of tables) {
            console.log(`\n--- Inspecting ${table} ---`);
            try {
                // Try to select empty result set just to get metadata columns
                const result = await connection.query(`SELECT TOP 1 * FROM ${table}`);
                if (result.columns) {
                    console.log('Columns found:', result.columns.map(c => c.name).join(', '));
                } else if (result.length > 0) {
                    console.log('Keys from first row:', Object.keys(result[0]).join(', '));
                } else {
                    // Fallback to syscolumn if no data
                    const query = `
                        SELECT c.column_name 
                        FROM SYSCOLUMN c
                        JOIN SYSTABLE t ON c.table_id = t.table_id
                        WHERE t.table_name = '${table}'
                        ORDER BY c.column_id
                    `;
                    const columns = await connection.query(query);
                    console.log('Columns from SYSCOLUMN:', columns.map(c => c.column_name).join(', '));
                }
            } catch (err) {
                console.error(`Error inspecting ${table}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkSchema();
