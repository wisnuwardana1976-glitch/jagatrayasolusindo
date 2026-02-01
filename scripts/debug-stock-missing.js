
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function debugStock() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // 1. Get Item IDs for Cas001, HDD001
        const items = await connection.query(`SELECT id, code, name FROM Items WHERE code IN ('Cas001', 'HDD001', 'MAI001', 'RAM001')`);
        console.log('Items:', items);

        if (items.length > 0) {
            const ids = items.map(i => i.id).join(',');

            // 2. Check Item Stocks
            const stocks = await connection.query(`SELECT * FROM ItemStocks WHERE item_id IN (${ids})`);
            console.log('ItemStocks:', stocks);

            // 3. Check Receivings (Linked to these items)
            const receipts = await connection.query(`
                SELECT r.id, r.doc_number, r.status, r.warehouse_id, rd.item_id, rd.quantity, rd.location_id
                FROM Receivings r
                JOIN ReceivingDetails rd ON r.id = rd.receiving_id
                WHERE rd.item_id IN (${ids})
            `);
            console.log('Receivings Trans:', receipts);
        } else {
            console.log('Items not found in Items table.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

debugStock();
