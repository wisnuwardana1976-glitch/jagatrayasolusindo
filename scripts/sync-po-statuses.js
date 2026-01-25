import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function syncPOStatuses() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected. Checking all Approved POs...');

        const pos = await connection.query(`SELECT id, doc_number FROM PurchaseOrders WHERE status = 'Approved'`);

        for (const po of pos) {
            // Get PO Items
            const poItems = await connection.query(`SELECT item_id, quantity FROM PurchaseOrderDetails WHERE po_id = ${po.id}`);

            if (poItems.length === 0) continue;

            // Get Received Items
            const receivedItems = await connection.query(`
                SELECT rd.item_id, SUM(rd.quantity) as total_received
                FROM ReceivingDetails rd
                JOIN Receivings r ON rd.receiving_id = r.id
                WHERE r.po_id = ${po.id} AND r.status != 'Cancelled'
                GROUP BY rd.item_id
            `);

            const receivedMap = {};
            receivedItems.forEach(item => {
                receivedMap[item.item_id] = item.total_received;
            });

            let allReceived = true;
            for (const item of poItems) {
                const received = receivedMap[item.item_id] || 0;
                if (received < item.quantity) {
                    allReceived = false;
                    break;
                }
            }

            if (allReceived) {
                console.log(`Updating ${po.doc_number} (ID: ${po.id}) to Closed...`);
                await connection.query(`UPDATE PurchaseOrders SET status = 'Closed' WHERE id = ${po.id}`);
            }
        }

        console.log('Sync complete.');

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) await connection.close();
    }
}

syncPOStatuses();
