import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createExchangeRateTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        // ==================== ExchangeRates (Master - Period) ====================
        console.log('Creating ExchangeRates table...');
        try {
            await conn.query(`
                CREATE TABLE ExchangeRates (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    rate_type_id INTEGER NOT NULL,
                    from_date DATE NOT NULL,
                    to_date DATE NOT NULL,
                    description VARCHAR(200),
                    status CHAR(1) DEFAULT 'A',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ ExchangeRates table created');
        } catch (e) {
            console.log('❌ ExchangeRates Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // ==================== ExchangeRateLines (Detail - Currency Pairs) ====================
        console.log('Creating ExchangeRateLines table...');
        try {
            await conn.query(`
                CREATE TABLE ExchangeRateLines (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    exchange_rate_id INTEGER NOT NULL,
                    from_currency_id INTEGER NOT NULL,
                    to_currency_id INTEGER NOT NULL,
                    rate DECIMAL(18,4) NOT NULL DEFAULT 0
                )
            `);
            console.log('✅ ExchangeRateLines table created');
        } catch (e) {
            console.log('❌ ExchangeRateLines Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // ==================== Insert Sample Data ====================
        console.log('\nInserting sample data...');
        try {
            // Get rate type IDs
            const comType = await conn.query("SELECT id FROM ExchangeRateTypes WHERE code = 'COM'");
            const taxType = await conn.query("SELECT id FROM ExchangeRateTypes WHERE code = 'TAX'");

            // Get currency IDs
            const currencies = await conn.query("SELECT id, code FROM Currencies ORDER BY code");
            const currMap = {};
            currencies.forEach(c => { currMap[c.code] = c.id; });

            if (comType[0] && currMap['IDR']) {
                // COM rate for Feb 2026
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2026-02-01', '2026-02-28', 'Kurs Commercial Februari 2026')`,
                    [comType[0].id]
                );
                const comRate = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const comRateId = comRate[0].id;

                // Insert rate lines for COM
                const comRates = [
                    ['USD', 15500.0000], ['EUR', 16800.0000], ['SGD', 11500.0000],
                    ['JPY', 103.5000], ['CNY', 2150.0000], ['MYR', 3500.0000], ['GBP', 19500.0000]
                ];
                for (const [code, rate] of comRates) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [comRateId, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ COM Feb 2026 rates inserted');

                // COM rate for Jan 2026
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2026-01-01', '2026-01-31', 'Kurs Commercial Januari 2026')`,
                    [comType[0].id]
                );
                const comRate2 = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const comRateId2 = comRate2[0].id;

                const comRates2 = [
                    ['USD', 15400.0000], ['EUR', 16700.0000], ['SGD', 11400.0000],
                    ['JPY', 102.0000], ['CNY', 2120.0000], ['MYR', 3480.0000], ['GBP', 19400.0000]
                ];
                for (const [code, rate] of comRates2) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [comRateId2, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ COM Jan 2026 rates inserted');
            }

            if (taxType[0] && currMap['IDR']) {
                // TAX rate for Feb 2026
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2026-02-01', '2026-02-28', 'Kurs Pajak Februari 2026')`,
                    [taxType[0].id]
                );
                const taxRate = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const taxRateId = taxRate[0].id;

                const taxRates = [
                    ['USD', 15550.0000], ['EUR', 16850.0000], ['SGD', 11550.0000],
                    ['JPY', 104.0000], ['GBP', 19550.0000]
                ];
                for (const [code, rate] of taxRates) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [taxRateId, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ TAX Feb 2026 rates inserted');
            }

        } catch (e) {
            console.log('❌ Sample Data Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createExchangeRateTables();
