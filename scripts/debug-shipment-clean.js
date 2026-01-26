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

        // Check SO Details for SO ID 1
        console.log('--- SO Details (so_id=1) ---');
        const soDetails = await connection.query(`SELECT * FROM SalesOrderDetails WHERE so_id = 1`);
        console.log(JSON.stringify(soDetails, null, 2));

        // Check Shipment Details for Shipment ID 15
        console.log('--- Shipment Details (shipment_id=15) ---');
        const shpDetails = await connection.query(`SELECT * FROM ShipmentDetails WHERE shipment_id = 15`);
        console.log(JSON.stringify(shpDetails, null, 2));

        // Run the join query
        console.log('--- Join Query ---');
        const serverQuery = `
        SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code,
               COALESCE(sod.unit_price, 0) as unit_price,
               COALESCE(so.tax_type, 'Exclude') as tax_type
        FROM ShipmentDetails d
        LEFT JOIN Items i ON d.item_id = i.id
        LEFT JOIN Shipments s ON d.shipment_id = s.id
        LEFT JOIN SalesOrders so ON s.so_id = so.id
        LEFT JOIN SalesOrderDetails sod ON s.so_id = sod.so_id AND d.item_id = sod.item_id
        WHERE d.shipment_id = 15
        `;
        const result = await connection.query(serverQuery);
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugShipment();
