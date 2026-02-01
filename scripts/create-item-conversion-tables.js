/**
 * Script untuk membuat tabel Item Conversion
 * - ItemConversions (Header)
 * - ItemConversionDetails (Input/Output items)
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

        // ==================== ITEM CONVERSIONS (HEADER) ====================
        console.log('📦 Creating ItemConversions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ItemConversions (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                doc_number VARCHAR(50) NOT NULL,
                doc_date DATE NOT NULL,
                warehouse_id INTEGER NULL, -- Made optional as location is now per item
                transcode_id INTEGER,
                notes TEXT,
                total_input_amount DECIMAL(18,2) DEFAULT 0,
                total_output_amount DECIMAL(18,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                FOREIGN KEY (warehouse_id) REFERENCES Warehouses(id),
                FOREIGN KEY (transcode_id) REFERENCES Transcodes(id)
            )
        `);
        console.log('✅ ItemConversions created!');

        // ==================== ITEM CONVERSION DETAILS ====================
        console.log('📦 Creating ItemConversionDetails table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ItemConversionDetails (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                conversion_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                detail_type VARCHAR(10) NOT NULL,
                quantity DECIMAL(18,4) NOT NULL,
                unit_cost DECIMAL(18,2) NOT NULL,
                amount DECIMAL(18,2) NOT NULL,
                notes VARCHAR(255),
                location_id INTEGER,
                FOREIGN KEY (conversion_id) REFERENCES ItemConversions(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES Items(id),
                FOREIGN KEY (location_id) REFERENCES Locations(id)
            )
        `);
        console.log('✅ ItemConversionDetails created!');

        console.log('');
        console.log('🎉 All Item Conversion tables created successfully!');

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
