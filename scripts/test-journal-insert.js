
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumnAndInsert() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // 1. Check Column Size
        const col = await connection.query(`
            SELECT c.column_name, c.width
            FROM SYSCOLUMN c 
            JOIN SYSTABLE t ON c.table_id = t.table_id 
            WHERE t.table_name = 'JournalVouchers' AND c.column_name = 'doc_number'
        `);
        console.log('Column Info:', col);

        // 2. Try Insert with long value
        const testDocNum = 'JV-RCV/012026/0024-TEST';
        console.log(`Trying insert with doc_number: ${testDocNum} (Length: ${testDocNum.length})`);

        try {
            await connection.query(
                "INSERT INTO JournalVouchers (doc_number, doc_date, description, status, source_type, ref_id) VALUES (?, ?, ?, ?, ?, ?)",
                [testDocNum, '2026-01-26', 'Test Insert', 'Posted', 'Receiving', 9999]
            );
            console.log('Insert Success!');

            // Cleanup
            await connection.query("DELETE FROM JournalVouchers WHERE doc_number = ?", [testDocNum]);
            console.log('Cleanup Success!');
        } catch (e) {
            console.error('Insert Failed:', e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumnAndInsert();
