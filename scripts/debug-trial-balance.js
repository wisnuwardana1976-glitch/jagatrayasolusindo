
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('DB Config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    db: process.env.DB_NAME,
    user: process.env.DB_USER
});

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        const startDate = '2026-01-01';
        const endDate = '2026-01-31';

        const query = `
      SELECT 
        a.id, a.code, a.name, a.type,
        
        -- Saldo Awal (sebelum startDate)
        SUM(CASE 
            WHEN jv.doc_date < ? AND jv.status = 'Posted' THEN jvd.debit 
            ELSE 0 
        END) as initial_debit,
        
        SUM(CASE 
            WHEN jv.doc_date < ? AND jv.status = 'Posted' THEN jvd.credit 
            ELSE 0 
        END) as initial_credit,

        -- Pergerakan (start s/d end)
        SUM(CASE 
            WHEN jv.doc_date >= ? AND jv.doc_date <= ? AND jv.status = 'Posted' THEN jvd.debit 
            ELSE 0 
        END) as movement_debit,
        
        SUM(CASE 
            WHEN jv.doc_date >= ? AND jv.doc_date <= ? AND jv.status = 'Posted' THEN jvd.credit 
            ELSE 0 
        END) as movement_credit

      FROM Accounts a
      LEFT JOIN JournalVoucherDetails jvd ON a.id = jvd.coa_id
      LEFT JOIN JournalVouchers jv ON jvd.jv_id = jv.id
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code ASC
    `;

        const params = [
            startDate, startDate, // Initial
            startDate, endDate,   // Movement Debit
            startDate, endDate    // Movement Credit
        ];

        console.log('Executing query...');
        const result = await connection.query(query, params);

        if (result.length > 0) {
            console.log('Found rows:', result.length);
            console.log('First row keys:', Object.keys(result[0]));
            console.log('First row raw:', result[0]);

            const row = result[0];
            const getVal = (key) => row[key] !== undefined ? row[key] : row[key.toUpperCase()];

            console.log('Test Access:');
            console.log('initial_debit:', getVal('initial_debit'), typeof getVal('initial_debit'));
            console.log('INITIAL_DEBIT:', row['INITIAL_DEBIT']);

            // Debug number conversion
            const safeFloat = (val) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                return isNaN(num) ? 0 : num;
            };
            console.log('Converted initial_debit:', safeFloat(getVal('initial_debit')));
        } else {
            console.log('No rows returned.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.close();
            console.log('Closed.');
        }
    }
}

run();
