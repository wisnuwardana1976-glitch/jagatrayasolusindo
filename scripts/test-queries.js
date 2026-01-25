import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkQueries() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // Test Header Query
        console.log('\nTesting Header Query...');
        try {
            const headerQuery = `
                SELECT r.*, p.name as partner_name, po.doc_number as po_number, w.description as warehouse_name, l.name as location_name
                FROM Receivings r
                LEFT JOIN Partners p ON r.partner_id = p.id
                LEFT JOIN PurchaseOrders po ON r.po_id = po.id
                LEFT JOIN Warehouses w ON r.warehouse_id = w.id
                LEFT JOIN Locations l ON r.location_id = l.id
                WHERE r.id = 1
            `;
            await connection.query(headerQuery);
            console.log('✅ Header Query passed');
        } catch (err) {
            console.error('❌ Header Query failed:', err.message);
        }

        // Test Details Query
        console.log('\nTesting Details Query...');
        try {
            const detailsQuery = `
                SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code
                FROM ReceivingDetails d
                LEFT JOIN Items i ON d.item_id = i.id
                WHERE d.receiving_id = 1
            `;
            await connection.query(detailsQuery);
            console.log('✅ Details Query passed');
        } catch (err) {
            console.error('❌ Details Query failed:', err.message);
        }

    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkQueries();
