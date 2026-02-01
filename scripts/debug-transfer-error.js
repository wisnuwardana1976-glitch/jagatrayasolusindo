
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        console.log('Connecting to database...');
        try {
            connection = await odbc.connect(connectionString);
        } catch (e) {
            console.log('Connection failed, checking if odbc mock or real issues', e);
            return;
        }
        console.log('Connected!');

        const lastTransfer = await connection.query('SELECT TOP 1 id FROM LocationTransfers ORDER BY id DESC');
        if (lastTransfer.length === 0) {
            console.log('No transfers found');
            return;
        }

        const id = lastTransfer[0].id;
        console.log(`Testing with Transfer ID: ${id}`);

        // Test Header Query
        console.log('Testing Header Query...');
        const headerQuery = `
          SELECT 
            lt.id, lt.doc_number, lt.doc_date, lt.source_location_id, lt.destination_location_id, 
            lt.status, CAST(lt.notes AS VARCHAR(2000)) as notes, lt.transcode_id, lt.created_at, lt.updated_at,
            l_src.code as source_location_code,
            l_src.name as source_location_name,
            w_src.description as source_warehouse_name,
            l_dest.code as destination_location_code,
            l_dest.name as destination_location_name,
            w_dest.description as destination_warehouse_name
          FROM LocationTransfers lt
          LEFT JOIN Locations l_src ON lt.source_location_id = l_src.id
          LEFT JOIN Locations l_dest ON lt.destination_location_id = l_dest.id
          LEFT JOIN SubWarehouses sw_src ON l_src.sub_warehouse_id = sw_src.id
          LEFT JOIN SubWarehouses sw_dest ON l_dest.sub_warehouse_id = sw_dest.id
          LEFT JOIN Warehouses w_src ON sw_src.warehouse_id = w_src.id
          LEFT JOIN Warehouses w_dest ON sw_dest.warehouse_id = w_dest.id
          WHERE lt.id = ?
        `;

        try {
            await connection.query(headerQuery, [id]);
            console.log('Header Query OK');
        } catch (e) {
            console.error('Header Query Failed:', e);
        }

        // Test Detail Query
        console.log('Testing Detail Query...');
        const detailQuery = `
          SELECT 
            ltd.id, ltd.transfer_id, ltd.item_id, ltd.quantity, CAST(ltd.notes AS VARCHAR(2000)) as notes,
            i.code as item_code,
            i.name as item_name,
            COALESCE(u.name, 'Unit') as unit_name
          FROM LocationTransferDetails ltd
          LEFT JOIN Items i ON ltd.item_id = i.id
          LEFT JOIN Units u ON i.unit_id = u.id
          WHERE ltd.transfer_id = ?
        `;

        try {
            await connection.query(detailQuery, [id]);
            console.log('Detail Query OK');
        } catch (e) {
            console.error('Detail Query Failed:', e);
            // Check Items columns
            console.log('Checking Items table columns...');
            const columns = await connection.query(`SELECT column_name FROM syscolumn JOIN systable ON syscolumn.table_id = systable.table_id WHERE table_name = 'Items'`);
            console.log('Items Columns:', columns.map(c => c.column_name).join(', '));
        }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
