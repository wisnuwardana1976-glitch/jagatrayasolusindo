
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugSql() {
    try {
        const connection = await odbc.connect(connectionString);

        const endDate = '2026-01-31';

        const query = `
        SELECT 
            a.code, a.name, a.type,
            SUM(CASE WHEN jv.status = 'Posted' AND jv.doc_date <= ? THEN jvd.debit ELSE 0 END) as total_debit,
            SUM(CASE WHEN jv.status = 'Posted' AND jv.doc_date <= ? THEN jvd.credit ELSE 0 END) as total_credit
        FROM Accounts a
        LEFT JOIN JournalVoucherDetails jvd ON a.id = jvd.account_id
        LEFT JOIN JournalVouchers jv ON jvd.jv_id = jv.id
        GROUP BY a.code, a.name, a.type
        ORDER BY a.code ASC
        `;

        const params = [endDate, endDate];

        console.log('Executing Query:', query);
        console.log('Params:', params);

        await connection.query(query, params);
        console.log('Success!');

        await connection.close();
    } catch (error) {
        console.error('SQL Error:', error);
        if (error.odbcErrors) {
            console.error('ODBC Errors:', JSON.stringify(error.odbcErrors, null, 2));
        }
    }
}

debugSql();
