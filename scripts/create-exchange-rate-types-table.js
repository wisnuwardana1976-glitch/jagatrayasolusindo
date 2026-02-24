import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createExchangeRateTypesTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        // ==================== ExchangeRateTypes Table ====================
        console.log('Creating ExchangeRateTypes table...');
        try {
            await conn.query(`
                CREATE TABLE ExchangeRateTypes (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    description VARCHAR(200),
                    active CHAR(1) DEFAULT 'Y'
                )
            `);
            console.log('✅ ExchangeRateTypes table created');

            // Insert sample data
            await conn.query(`INSERT INTO ExchangeRateTypes (code, name, description) VALUES ('COM', 'Commercial', 'Kurs komersial untuk transaksi umum')`);
            await conn.query(`INSERT INTO ExchangeRateTypes (code, name, description) VALUES ('TAX', 'Tax / Pajak', 'Kurs pajak dari Kementerian Keuangan')`);
            await conn.query(`INSERT INTO ExchangeRateTypes (code, name, description) VALUES ('REVAL', 'Revaluasi', 'Kurs revaluasi untuk penutupan periode')`);
            await conn.query(`INSERT INTO ExchangeRateTypes (code, name, description) VALUES ('BI', 'Bank Indonesia', 'Kurs referensi Bank Indonesia (JISDOR)')`);
            await conn.query(`INSERT INTO ExchangeRateTypes (code, name, description) VALUES ('SPOT', 'Spot Rate', 'Kurs spot untuk transaksi real-time')`);
            console.log('✅ Sample data inserted');

        } catch (e) {
            console.log('❌ ExchangeRateTypes Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // ==================== Add rate_type_id to CurrencyRates ====================
        console.log('\nAdding rate_type_id column to CurrencyRates...');
        try {
            await conn.query(`ALTER TABLE CurrencyRates ADD rate_type_id INTEGER NULL`);
            console.log('✅ rate_type_id column added');

            // Set existing rates to COM (Commercial) by default
            const comType = await conn.query("SELECT id FROM ExchangeRateTypes WHERE code = 'COM'");
            if (comType[0]) {
                await conn.query(`UPDATE CurrencyRates SET rate_type_id = ${comType[0].id}`);
                console.log('✅ Existing rates updated to COM type');
            }
        } catch (e) {
            console.log('❌ Alter Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createExchangeRateTypesTable();
