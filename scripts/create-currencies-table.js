import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createCurrenciesTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        // ==================== Currencies Table ====================
        console.log('Creating Currencies table...');
        try {
            await conn.query(`
                CREATE TABLE Currencies (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(10) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    symbol VARCHAR(5),
                    decimal_places INTEGER DEFAULT 2,
                    is_base CHAR(1) DEFAULT 'N',
                    active CHAR(1) DEFAULT 'Y'
                )
            `);
            console.log('✅ Currencies table created');

            // Insert sample data
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('IDR', 'Indonesian Rupiah', 'Rp', 0, 'Y')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('USD', 'US Dollar', '$', 2, 'N')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('EUR', 'Euro', '€', 2, 'N')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('SGD', 'Singapore Dollar', 'S$', 2, 'N')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('JPY', 'Japanese Yen', '¥', 0, 'N')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('CNY', 'Chinese Yuan', '¥', 2, 'N')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('MYR', 'Malaysian Ringgit', 'RM', 2, 'N')`);
            await conn.query(`INSERT INTO Currencies (code, name, symbol, decimal_places, is_base) VALUES ('GBP', 'British Pound', '£', 2, 'N')`);
            console.log('✅ Sample currencies inserted');

        } catch (e) {
            console.log('❌ Currencies Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // ==================== CurrencyRates Table ====================
        console.log('\nCreating CurrencyRates table...');
        try {
            await conn.query(`
                CREATE TABLE CurrencyRates (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    currency_id INTEGER NOT NULL,
                    rate_date DATE NOT NULL,
                    buy_rate DECIMAL(18,6) NOT NULL DEFAULT 1,
                    sell_rate DECIMAL(18,6) NOT NULL DEFAULT 1,
                    middle_rate DECIMAL(18,6) NOT NULL DEFAULT 1,
                    FOREIGN KEY (currency_id) REFERENCES Currencies(id)
                )
            `);
            console.log('✅ CurrencyRates table created');

            // Get currency IDs
            const currencies = await conn.query('SELECT id, code FROM Currencies');
            const currMap = {};
            currencies.forEach(c => { currMap[c.code] = c.id; });

            const today = new Date().toISOString().split('T')[0];

            // Insert sample rates (approximate rates to IDR)
            if (currMap['USD']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['USD']}, '${today}', 15400.000000, 15600.000000, 15500.000000)`);
            if (currMap['EUR']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['EUR']}, '${today}', 16800.000000, 17000.000000, 16900.000000)`);
            if (currMap['SGD']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['SGD']}, '${today}', 11500.000000, 11700.000000, 11600.000000)`);
            if (currMap['JPY']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['JPY']}, '${today}', 102.000000, 104.000000, 103.000000)`);
            if (currMap['CNY']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['CNY']}, '${today}', 2130.000000, 2170.000000, 2150.000000)`);
            if (currMap['MYR']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['MYR']}, '${today}', 3450.000000, 3510.000000, 3480.000000)`);
            if (currMap['GBP']) await conn.query(`INSERT INTO CurrencyRates (currency_id, rate_date, buy_rate, sell_rate, middle_rate) VALUES (${currMap['GBP']}, '${today}', 19600.000000, 19800.000000, 19700.000000)`);
            console.log('✅ Sample rates inserted');

        } catch (e) {
            console.log('❌ CurrencyRates Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createCurrenciesTables();
