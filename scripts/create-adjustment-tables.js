/**
 * Script untuk membuat tabel Adjustment
 * - InventoryAdjustments & InventoryAdjustmentDetails
 * - APAdjustments & APAdjustmentAllocations
 * - ARAdjustments & ARAdjustmentAllocations
 */

import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTables() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!');

        // ==================== INVENTORY ADJUSTMENTS ====================
        console.log('📦 Creating InventoryAdjustments table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS InventoryAdjustments (
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
                updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                FOREIGN KEY (warehouse_id) REFERENCES Warehouses(id),
                FOREIGN KEY (counter_account_id) REFERENCES Accounts(id),
                FOREIGN KEY (transcode_id) REFERENCES Transcodes(id)
            )
        `);
        console.log('✅ InventoryAdjustments created!');

        console.log('📦 Creating InventoryAdjustmentDetails table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS InventoryAdjustmentDetails (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                adjustment_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                quantity DECIMAL(18,4) NOT NULL,
                unit_cost DECIMAL(18,2) NOT NULL,
                amount DECIMAL(18,2) NOT NULL,
                notes VARCHAR(255),
                FOREIGN KEY (adjustment_id) REFERENCES InventoryAdjustments(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES Items(id)
            )
        `);
        console.log('✅ InventoryAdjustmentDetails created!');

        // ==================== AP ADJUSTMENTS ====================
        console.log('💰 Creating APAdjustments table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS APAdjustments (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                doc_number VARCHAR(50) NOT NULL,
                doc_date DATE NOT NULL,
                adjustment_type VARCHAR(6) NOT NULL,
                transcode_id INTEGER,
                partner_id INTEGER NOT NULL,
                counter_account_id INTEGER NOT NULL,
                amount DECIMAL(18,2) NOT NULL,
                notes TEXT,
                status VARCHAR(20) DEFAULT 'Draft',
                allocate_to_invoice CHAR(1) DEFAULT 'N',
                created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                FOREIGN KEY (partner_id) REFERENCES Partners(id),
                FOREIGN KEY (counter_account_id) REFERENCES Accounts(id),
                FOREIGN KEY (transcode_id) REFERENCES Transcodes(id)
            )
        `);
        console.log('✅ APAdjustments created!');

        console.log('💰 Creating APAdjustmentAllocations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS APAdjustmentAllocations (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                adjustment_id INTEGER NOT NULL,
                ap_invoice_id INTEGER NOT NULL,
                allocated_amount DECIMAL(18,2) NOT NULL,
                FOREIGN KEY (adjustment_id) REFERENCES APAdjustments(id) ON DELETE CASCADE,
                FOREIGN KEY (ap_invoice_id) REFERENCES APInvoices(id)
            )
        `);
        console.log('✅ APAdjustmentAllocations created!');

        // ==================== AR ADJUSTMENTS ====================
        console.log('💵 Creating ARAdjustments table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ARAdjustments (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                doc_number VARCHAR(50) NOT NULL,
                doc_date DATE NOT NULL,
                adjustment_type VARCHAR(6) NOT NULL,
                transcode_id INTEGER,
                partner_id INTEGER NOT NULL,
                counter_account_id INTEGER NOT NULL,
                amount DECIMAL(18,2) NOT NULL,
                notes TEXT,
                status VARCHAR(20) DEFAULT 'Draft',
                allocate_to_invoice CHAR(1) DEFAULT 'N',
                created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                FOREIGN KEY (partner_id) REFERENCES Partners(id),
                FOREIGN KEY (counter_account_id) REFERENCES Accounts(id),
                FOREIGN KEY (transcode_id) REFERENCES Transcodes(id)
            )
        `);
        console.log('✅ ARAdjustments created!');

        console.log('💵 Creating ARAdjustmentAllocations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ARAdjustmentAllocations (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                adjustment_id INTEGER NOT NULL,
                ar_invoice_id INTEGER NOT NULL,
                allocated_amount DECIMAL(18,2) NOT NULL,
                FOREIGN KEY (adjustment_id) REFERENCES ARAdjustments(id) ON DELETE CASCADE,
                FOREIGN KEY (ar_invoice_id) REFERENCES ARInvoices(id)
            )
        `);
        console.log('✅ ARAdjustmentAllocations created!');

        console.log('');
        console.log('🎉 All adjustment tables created successfully!');

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Table already exists, skipping...');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        if (connection) {
            await connection.close();
            console.log('🔌 Connection closed.');
        }
    }
}

createTables();
