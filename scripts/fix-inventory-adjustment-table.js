import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkAndFixTable() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!');

        // Check if table exists
        const tableCheck = await connection.query(`
            SELECT table_name FROM systable WHERE table_name = 'InventoryAdjustments'
        `);

        if (tableCheck.length === 0) {
            console.log('❌ Table InventoryAdjustments does not exist! Running create script...');

            // Create full table
            await connection.query(`
                CREATE TABLE InventoryAdjustments (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    doc_number VARCHAR(50) NOT NULL,
                    doc_date DATE NOT NULL,
                    adjustment_type VARCHAR(3) NOT NULL,
                    transcode_id INTEGER,
                    warehouse_id INTEGER,
                    counter_account_id INTEGER NOT NULL,
                    notes TEXT,
                    status VARCHAR(20) DEFAULT 'Draft',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ Created InventoryAdjustments table!');
        } else {
            console.log('✅ Table InventoryAdjustments exists, checking columns...');

            // Get existing columns
            const cols = await connection.query(`
                SELECT c.column_name 
                FROM syscolumn c 
                JOIN systable t ON c.table_id = t.table_id 
                WHERE t.table_name = 'InventoryAdjustments'
            `);
            const existingCols = cols.map(c => c.column_name.toLowerCase());
            console.log('Existing columns:', existingCols.join(', '));

            // Check for missing columns and add them
            const requiredCols = [
                { name: 'adjustment_type', def: "ALTER TABLE InventoryAdjustments ADD adjustment_type VARCHAR(3) DEFAULT 'IN'" },
                { name: 'transcode_id', def: "ALTER TABLE InventoryAdjustments ADD transcode_id INTEGER" },
                { name: 'counter_account_id', def: "ALTER TABLE InventoryAdjustments ADD counter_account_id INTEGER" },
                { name: 'notes', def: "ALTER TABLE InventoryAdjustments ADD notes TEXT" },
                { name: 'status', def: "ALTER TABLE InventoryAdjustments ADD status VARCHAR(20) DEFAULT 'Draft'" }
            ];

            for (const col of requiredCols) {
                if (!existingCols.includes(col.name.toLowerCase())) {
                    console.log(`➕ Adding missing column: ${col.name}`);
                    await connection.query(col.def);
                    console.log(`✅ Added ${col.name}`);
                }
            }
        }

        // Check InventoryAdjustmentDetails table
        const detailsTableCheck = await connection.query(`
            SELECT table_name FROM systable WHERE table_name = 'InventoryAdjustmentDetails'
        `);

        if (detailsTableCheck.length === 0) {
            console.log('📦 Creating InventoryAdjustmentDetails table...');
            await connection.query(`
                CREATE TABLE InventoryAdjustmentDetails (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    adjustment_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    quantity DECIMAL(18,4) NOT NULL,
                    unit_cost DECIMAL(18,2) NOT NULL,
                    amount DECIMAL(18,2) NOT NULL,
                    notes VARCHAR(255)
                )
            `);
            console.log('✅ Created InventoryAdjustmentDetails table!');
        } else {
            console.log('✅ InventoryAdjustmentDetails table exists');
        }

        console.log('\n🎉 Database check complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
            console.log('🔌 Connection closed.');
        }
    }
}

checkAndFixTable();
