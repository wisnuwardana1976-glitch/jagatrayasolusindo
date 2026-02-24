import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createFixedAssetTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        // 1. FixedAssetCategories
        console.log('Creating FixedAssetCategories table...');
        try {
            await conn.query(`
                CREATE TABLE FixedAssetCategories (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    useful_life_months INTEGER DEFAULT 12,
                    depreciation_method VARCHAR(20) DEFAULT 'StraightLine',
                    depreciation_account_id INTEGER NULL,
                    accumulated_account_id INTEGER NULL,
                    asset_account_id INTEGER NULL,
                    active CHAR(1) DEFAULT 'Y',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ FixedAssetCategories table created');
        } catch (e) {
            console.log('⚠️ FixedAssetCategories:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 2. FixedAssets
        console.log('Creating FixedAssets table...');
        try {
            await conn.query(`
                CREATE TABLE FixedAssets (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    asset_no VARCHAR(30) NOT NULL UNIQUE,
                    name VARCHAR(200) NOT NULL,
                    description VARCHAR(500),
                    category_id INTEGER NOT NULL,
                    acquisition_date DATE NOT NULL,
                    acquisition_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
                    salvage_value DECIMAL(18,2) DEFAULT 0,
                    useful_life_months INTEGER DEFAULT 12,
                    depreciation_method VARCHAR(20) DEFAULT 'StraightLine',
                    location VARCHAR(100),
                    serial_number VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'Active',
                    disposal_date DATE NULL,
                    disposal_value DECIMAL(18,2) DEFAULT 0,
                    accumulated_depreciation DECIMAL(18,2) DEFAULT 0,
                    book_value DECIMAL(18,2) DEFAULT 0,
                    notes VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ FixedAssets table created');
        } catch (e) {
            console.log('⚠️ FixedAssets:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 3. FixedAssetDepreciations
        console.log('Creating FixedAssetDepreciations table...');
        try {
            await conn.query(`
                CREATE TABLE FixedAssetDepreciations (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    asset_id INTEGER NOT NULL,
                    period_date DATE NOT NULL,
                    depreciation_amount DECIMAL(18,2) DEFAULT 0,
                    accumulated_amount DECIMAL(18,2) DEFAULT 0,
                    book_value DECIMAL(18,2) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'Posted',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ FixedAssetDepreciations table created');
        } catch (e) {
            console.log('⚠️ FixedAssetDepreciations:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // Insert FA transcode for auto-numbering
        console.log('\nInserting Fixed Asset transcode...');
        try {
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('FA', 'Fixed Asset', 'FA', 0, 'Aset Tetap')`);
            console.log('✅ FA transcode inserted');
        } catch (e) {
            console.log('⚠️ Transcode:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\n✅ All Fixed Asset tables created successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createFixedAssetTables();
