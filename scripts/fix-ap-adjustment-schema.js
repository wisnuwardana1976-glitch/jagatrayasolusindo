import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // 1. Create APAdjustmentAllocations table
        try {
            await connection.query(`
                CREATE TABLE APAdjustmentAllocations (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    adjustment_id INTEGER NOT NULL,
                    ap_invoice_id INTEGER NOT NULL,
                    allocated_amount NUMERIC(15,2) DEFAULT 0,
                    FOREIGN KEY (adjustment_id) REFERENCES APAdjustments(id) ON DELETE CASCADE,
                    FOREIGN KEY (ap_invoice_id) REFERENCES APInvoices(id)
                )
            `);
            console.log('✅ Created APAdjustmentAllocations table.');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('ℹ️ APAdjustmentAllocations table already exists.');
            } else {
                console.log('❌ Error creating APAdjustmentAllocations table:', e.message);
            }
        }

        // 2. Add allocate_to_invoice column to APAdjustments
        try {
            await connection.query("ALTER TABLE APAdjustments ADD allocate_to_invoice CHAR(1) DEFAULT 'N'");
            console.log('✅ Added allocate_to_invoice column to APAdjustments.');
        } catch (e) {
            if (e.message.includes('already exists') || e.message.includes('Column already exists')) {
                console.log('ℹ️ allocate_to_invoice column already exists.');
            } else {
                console.log('❌ Error adding allocate_to_invoice column:', e.message);
            }
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

fixSchema();
