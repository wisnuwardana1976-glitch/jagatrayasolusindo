import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugPO008() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        const docNumber = 'PO/012026/0008';
        console.log(`Inspecting ${docNumber}...`);

        // 1. Get PO ID
        const poResult = await connection.query(`SELECT * FROM PurchaseOrders WHERE doc_number = '${docNumber}'`);
        if (poResult.length === 0) {
            console.log('PO Not Found');
            return;
        }
        const po = poResult[0];
        console.log('PO Header:', po);

        // 2. Get PO Items
        const poItems = await connection.query(`SELECT item_id, quantity FROM PurchaseOrderDetails WHERE po_id = ${po.id}`);
        console.log('PO Items:', poItems);

        // 3. Get Received Items
        const receivedItems = await connection.query(`
            SELECT r.doc_number as receiving_no, r.status, rd.item_id, rd.quantity
            FROM ReceivingDetails rd
            JOIN Receivings r ON rd.receiving_id = r.id
            WHERE r.po_id = ${po.id}
        `);
        console.log('Received Items Linked to this PO:', receivedItems);

        // 4. Calculate Totals
        const receivedMap = {};
        receivedItems.forEach(item => {
            if (item.status !== 'Cancelled') {
                receivedMap[item.item_id] = (receivedMap[item.item_id] || 0) + item.quantity;
            }
        });

        console.log('\n--- Comparison ---');
        let allReceived = true;
        for (const item of poItems) {
            const received = receivedMap[item.item_id] || 0;
            console.log(`Item ${item.item_id}: Ordered ${item.quantity}, Received ${received}`);
            if (received < item.quantity) {
                allReceived = false;
                console.log('  -> OUTSTANDING');
            } else {
                console.log('  -> FULLY RECEIVED');
            }
        }

        console.log(`\nShould be closed? ${allReceived}`);
        console.log(`Current Status: ${po.status}`);

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) await connection.close();
    }
}

debugPO008();
