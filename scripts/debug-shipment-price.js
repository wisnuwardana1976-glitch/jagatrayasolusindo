import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugShipment() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // 1. Get Shipment ID
        const shp = await connection.query("SELECT id, so_id FROM Shipments WHERE doc_number = 'SHP/012026/0015'");
        console.log('Shipment:', shp);

        if (shp.length === 0) {
            console.log('Shipment not found');
            return;
        }

        const shipmentId = shp[0].id;
        const soId = shp[0].so_id;
        console.log(`Shipment ID: ${shipmentId}, SO ID: ${soId}`);

        // 2. Get Shipment Details
        const shpDetails = await connection.query(`SELECT * FROM ShipmentDetails WHERE shipment_id = ${shipmentId}`);
        console.log('Shipment Details:', shpDetails);

        // 3. Get SO Details
        if (soId) {
            const soDetails = await connection.query(`SELECT * FROM SalesOrderDetails WHERE so_id = ${soId}`);
            console.log('SO Details:', soDetails);
        } else {
            console.log('No SO linked');
        }

        // 4. Run the query from server/index.js
        console.log('--- Running Server Query ---');
        const serverQuery = `
        SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code,
               COALESCE(sod.unit_price, 0) as unit_price,
               COALESCE(so.tax_type, 'Exclude') as tax_type
        FROM ShipmentDetails d
        LEFT JOIN Items i ON d.item_id = i.id
        LEFT JOIN Shipments s ON d.shipment_id = s.id
        LEFT JOIN SalesOrders so ON s.so_id = so.id
        LEFT JOIN SalesOrderDetails sod ON s.so_id = sod.so_id AND d.item_id = sod.item_id
        WHERE d.shipment_id = ${shipmentId}
        `;
        const result = await connection.query(serverQuery);
        console.log('Server Query Result:', result);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugShipment();
