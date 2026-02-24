import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function insertDecemberRates() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Inserting December 2025 & 2026 sample data...');
        try {
            // Get rate type IDs
            const comType = await conn.query("SELECT id FROM ExchangeRateTypes WHERE code = 'COM'");
            const taxType = await conn.query("SELECT id FROM ExchangeRateTypes WHERE code = 'TAX'");

            // Get currency IDs
            const currencies = await conn.query("SELECT id, code FROM Currencies ORDER BY code");
            const currMap = {};
            currencies.forEach(c => { currMap[c.code] = c.id; });

            if (comType[0] && currMap['IDR']) {
                // ==================== COM DEC 2025 ====================
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2025-12-01', '2025-12-31', 'Kurs Commercial Desember 2025')`,
                    [comType[0].id]
                );
                const comRateDec25 = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const comRateIdDec25 = comRateDec25[0].id;

                const comRatesDec25 = [
                    ['USD', 15300.0000], ['EUR', 16600.0000], ['SGD', 11300.0000],
                    ['JPY', 101.0000], ['CNY', 2100.0000], ['MYR', 3450.0000], ['GBP', 19300.0000]
                ];
                for (const [code, rate] of comRatesDec25) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [comRateIdDec25, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ COM Dec 2025 rates inserted');

                // ==================== COM DEC 2026 ====================
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2026-12-01', '2026-12-31', 'Kurs Commercial Desember 2026')`,
                    [comType[0].id]
                );
                const comRateDec26 = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const comRateIdDec26 = comRateDec26[0].id;

                const comRatesDec26 = [
                    ['USD', 15800.0000], ['EUR', 17000.0000], ['SGD', 11800.0000],
                    ['JPY', 106.0000], ['CNY', 2200.0000], ['MYR', 3600.0000], ['GBP', 19800.0000]
                ];
                for (const [code, rate] of comRatesDec26) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [comRateIdDec26, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ COM Dec 2026 rates inserted');
            }

            if (taxType[0] && currMap['IDR']) {
                // ==================== TAX DEC 2025 ====================
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2025-12-01', '2025-12-31', 'Kurs Pajak Desember 2025')`,
                    [taxType[0].id]
                );
                const taxRateDec25 = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const taxRateIdDec25 = taxRateDec25[0].id;

                const taxRatesDec25 = [
                    ['USD', 15350.0000], ['EUR', 16650.0000], ['SGD', 11350.0000],
                    ['JPY', 101.5000], ['GBP', 19350.0000]
                ];
                for (const [code, rate] of taxRatesDec25) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [taxRateIdDec25, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ TAX Dec 2025 rates inserted');

                // ==================== TAX DEC 2026 ====================
                await conn.query(
                    `INSERT INTO ExchangeRates (rate_type_id, from_date, to_date, description) VALUES (?, '2026-12-01', '2026-12-31', 'Kurs Pajak Desember 2026')`,
                    [taxType[0].id]
                );
                const taxRateDec26 = await conn.query("SELECT MAX(id) as id FROM ExchangeRates");
                const taxRateIdDec26 = taxRateDec26[0].id;

                const taxRatesDec26 = [
                    ['USD', 15850.0000], ['EUR', 17050.0000], ['SGD', 11850.0000],
                    ['JPY', 106.5000], ['GBP', 19850.0000]
                ];
                for (const [code, rate] of taxRatesDec26) {
                    if (currMap[code]) {
                        await conn.query(
                            'INSERT INTO ExchangeRateLines (exchange_rate_id, from_currency_id, to_currency_id, rate) VALUES (?, ?, ?, ?)',
                            [taxRateIdDec26, currMap['IDR'], currMap[code], rate]
                        );
                    }
                }
                console.log('✅ TAX Dec 2026 rates inserted');
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

insertDecemberRates();
