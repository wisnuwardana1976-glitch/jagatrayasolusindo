import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixData() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        // Fix the adjustment_id to 1 for existing details
        await connection.query('UPDATE InventoryAdjustmentDetails SET adjustment_id = 1 WHERE adjustment_id = 0');
        console.log('✅ Fixed adjustment_id in details');

        // Also reset status to Approved so we can test posting again
        await connection.query("UPDATE InventoryAdjustments SET status = 'Approved' WHERE id = 1");
        console.log('✅ Reset adjustment status to Approved');

        // Verify
        const details = await connection.query('SELECT * FROM InventoryAdjustmentDetails WHERE adjustment_id = 1');
        console.log('Details now linked to adjustment 1:', details.length);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

fixData();
