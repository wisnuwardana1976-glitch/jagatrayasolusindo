
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createReportTable() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        console.log('Creating ReportDefinitions table...');
        try {
            await connection.query(`
                CREATE TABLE ReportDefinitions (
                    id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
                    report_code VARCHAR(50),
                    module VARCHAR(50),
                    category VARCHAR(50),
                    report_type VARCHAR(50),
                    name VARCHAR(255),
                    file_name VARCHAR(255)
                )
            `);
            console.log('Table ReportDefinitions created successfully.');
        } catch (tableError) {
            console.log('Table creation failed (likely exists):', tableError.message);
        }

        // Add sample data if empty
        const count = await connection.query('SELECT count(*) as cnt FROM ReportDefinitions');
        if (count[0].cnt === 0) {
            console.log('Seeding sample data...');
            await connection.query(`
                INSERT INTO ReportDefinitions (report_code, module, category, report_type, name, file_name)
                VALUES ('200001', 'AP', 'AP*', 'TKPI', 'AP BALANCE SUMMARY BY COA', '20AP_ADSummaryByAPAcc.rpt')
            `);
            await connection.query(`
                INSERT INTO ReportDefinitions (report_code, module, category, report_type, name, file_name)
                VALUES ('20APOUT', 'AP', 'AP', 'TKPI', 'AP OUTSTANDING', 'AP_ADOutStanding.rpt')
            `);
            await connection.query(`
                INSERT INTO ReportDefinitions (report_code, module, category, report_type, name, file_name)
                VALUES ('0001', 'AP', '', 'TKPI', 'UANG MUKA OUTSTANDING', 'AP_ADAdvanceOutstanding.rpt')
            `);
        } else {
            console.log('Table has data, skipping seed.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

createReportTable();
