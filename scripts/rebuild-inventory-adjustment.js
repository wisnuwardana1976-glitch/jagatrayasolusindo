import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function rebuildTable() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!');

        // Drop existing tables and recreate with correct structure
        console.log('📦 Dropping old tables...');
        try {
            await connection.query('DROP TABLE InventoryAdjustmentDetails');
            console.log('✅ Dropped InventoryAdjustmentDetails');
        } catch (e) {
            console.log('ℹ️  InventoryAdjustmentDetails not found');
        }

        try {
            await connection.query('DROP TABLE InventoryAdjustments');
            console.log('✅ Dropped InventoryAdjustments');
        } catch (e) {
            console.log('ℹ️  InventoryAdjustments not found');
        }

        // Create tables with correct structure
        console.log('📦 Creating InventoryAdjustments table...');
        await connection.query(`
            CREATE TABLE InventoryAdjustments (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                doc_number VARCHAR(50) NOT NULL,
                doc_date DATE NOT NULL,
                adjustment_type VARCHAR(3) NOT NULL,
                transcode_id INTEGER NULL,
                warehouse_id INTEGER NULL,
                counter_account_id INTEGER NULL,
                notes TEXT NULL,
                status VARCHAR(20) DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
            )
        `);
        console.log('✅ InventoryAdjustments created!');

        console.log('📦 Creating InventoryAdjustmentDetails table...');
        await connection.query(`
            CREATE TABLE InventoryAdjustmentDetails (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                adjustment_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                quantity DECIMAL(18,4) NOT NULL,
                unit_cost DECIMAL(18,2) NOT NULL,
                amount DECIMAL(18,2) NOT NULL,
                notes VARCHAR(255) NULL
            )
        `);
        console.log('✅ InventoryAdjustmentDetails created!');

        console.log('\n🎉 Tables rebuilt successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
            console.log('🔌 Connection closed.');
        }
    }
}

rebuildTable();
