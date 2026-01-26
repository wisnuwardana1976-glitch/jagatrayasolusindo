
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function testLogic() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // Mimic getGlAccount
        const getGlAccount = async (key) => {
            const res = await connection.query('SELECT account_id FROM GeneralLedgerSettings WHERE setting_key = ?', [key]);
            return res.length > 0 ? res[0].account_id : null;
        };

        const rxId = 9; // Based on previous output

        // 1. Get Accounts
        const inventoryAcc = await getGlAccount('inventory_account');
        const apTempAcc = await getGlAccount('ap_temp_account');

        console.log('Inventory Acc ID:', inventoryAcc);
        console.log('AP Temp Acc ID:', apTempAcc);

        if (inventoryAcc && apTempAcc) {
            // 2. Get Data
            const query = `
                SELECT rd.item_id, rd.quantity, pod.unit_price, (rd.quantity * pod.unit_price) as total_value
                FROM ReceivingDetails rd
                JOIN Receivings r ON rd.receiving_id = r.id
                JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
                WHERE r.id = ?
            `;
            console.log('Running query:', query);

            const items = await connection.query(query, [rxId]);
            console.log('Items found:', items);

            const totalAmount = items.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);
            console.log('Total Amount:', totalAmount);

            if (totalAmount > 0) {
                console.log('Logic says: Create Journal!');
            } else {
                console.log('Logic says: Total amount is 0, no journal.');
            }
        } else {
            console.log('Missing accounts!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

testLogic();
