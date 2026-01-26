import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTable() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        const query = `
            CREATE TABLE AccountingPeriods (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                code VARCHAR(20) NOT NULL,
                name VARCHAR(100),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'Open',
                active CHAR(1) DEFAULT 'Y',
                CONSTRAINT UQ_AccountingPeriod_Code UNIQUE (code)
            )
        `;

        await connection.query(query);
        console.log('Table AccountingPeriods created successfully.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

createTable();
