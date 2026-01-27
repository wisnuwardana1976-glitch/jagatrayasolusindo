
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addGiroBankColumn() {
    let connection;
    try {
        console.log('Connecting to DB...');
        connection = await odbc.connect(connectionString);

        // Check if column exists
        const checkRes = await connection.query(`
            SELECT cname FROM sys.syscolumns 
            WHERE tname = 'JournalVouchers' AND cname = 'giro_bank_name'
        `);

        if (checkRes.length > 0) {
            console.log('Column "giro_bank_name" already exists.');
        } else {
            console.log('Adding column "giro_bank_name"...');
            await connection.query(`ALTER TABLE JournalVouchers ADD giro_bank_name VARCHAR(100) NULL`);
            console.log('Column added successfully.');
        }

    } catch (e) {
        console.error('Migration Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

addGiroBankColumn();
