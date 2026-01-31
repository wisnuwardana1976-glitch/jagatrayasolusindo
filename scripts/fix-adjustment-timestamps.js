import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // APAdjustments
        try {
            await connection.query("ALTER TABLE APAdjustments ADD created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP");
            console.log('✅ Added created_at to APAdjustments');
        } catch (e) {
            console.log('ℹ️ APAdjustments.created_at:', e.message); // Likely already exists
        }

        try {
            await connection.query("ALTER TABLE APAdjustments ADD updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP");
            console.log('✅ Added updated_at to APAdjustments');
        } catch (e) {
            console.log('ℹ️ APAdjustments.updated_at:', e.message);
        }

        // ARAdjustments
        try {
            await connection.query("ALTER TABLE ARAdjustments ADD created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP");
            console.log('✅ Added created_at to ARAdjustments');
        } catch (e) {
            console.log('ℹ️ ARAdjustments.created_at:', e.message);
        }

        try {
            await connection.query("ALTER TABLE ARAdjustments ADD updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP");
            console.log('✅ Added updated_at to ARAdjustments');
        } catch (e) {
            console.log('ℹ️ ARAdjustments.updated_at:', e.message);
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

fixSchema();
