import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addTranscodeId() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        try {
            await connection.query('ALTER TABLE Shipments ADD transcode_id INTEGER');
            console.log('Added transcode_id to Shipments.');
        } catch (e) {
            console.log('Column transcode_id likely exists:', e.message);
        }

        // Add Shipment Transaction Type (nomortranscode = 4) if not exists
        const trans = await connection.query("SELECT id FROM Transactions WHERE nomortranscode = 4");
        if (trans.length === 0) {
            await connection.query("INSERT INTO Transactions (nomortranscode, description) VALUES (4, 'Shipment / Delivery')");
            console.log('Added Shipment Transaction Type (4).');
        } else {
            console.log('Shipment Transaction Type (4) already exists.');
        }

        // Add a default Transcode for Shipment if not exists
        const codes = await connection.query("SELECT id FROM Transcodes WHERE nomortranscode = 4");
        if (codes.length === 0) {
            await connection.query("INSERT INTO Transcodes (code, name, prefix, format, description, active, nomortranscode) VALUES ('DO', 'Delivery Order', 'DO', '{PREFIX}/{MM}{YYYY}/{SEQ}', 'Standard Delivery', 'Y', 4)");
            console.log('Added default Shipment Transcode (DO).');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

addTranscodeId();
