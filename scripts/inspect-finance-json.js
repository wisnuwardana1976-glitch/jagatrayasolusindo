
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

function replacer(key, value) {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

async function inspectSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log("=== JournalVoucherDetails Columns ===");
        const jvDetailsCols = await connection.query(`
            SELECT c.column_name, d.domain_name, c.width, c.scale 
            FROM SYSCOLUMN c
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id
            JOIN SYSTABLE t ON c.table_id = t.table_id
            WHERE t.table_name = 'JournalVoucherDetails'
            ORDER BY c.column_id
        `);
        console.log(JSON.stringify(jvDetailsCols, replacer, 2));

        console.log("\n=== Transcodes ===");
        const transcodes = await connection.query("SELECT id, code, name, nomortranscode FROM Transcodes WHERE active = 'Y' AND nomortranscode IN (0, 7, 8, 9, 10, 11, 12, 13, 14)"); // Filter for relevant IDs if possible, or all

        // Let's iterate and print manually to avoid huge JSON if too many
        const allTranscodes = await connection.query("SELECT id, code, name, nomortranscode FROM Transcodes WHERE active = 'Y'");
        console.log(JSON.stringify(allTranscodes, replacer, 2));

        console.log("\n=== Bank Accounts ===");
        const bankAccounts = await connection.query("SELECT * FROM BankAccounts");
        console.log(JSON.stringify(bankAccounts, replacer, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

inspectSchema();
