// Script to update ReportDefinitions to use jrxml file
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function updateReportFile() {
    let conn;
    try {
        conn = await odbc.connect(connectionString);
        console.log('Connected to database');

        // Update the report file from .rpt to .jrxml
        const result = await conn.query(`
      UPDATE ReportDefinitions 
      SET file_name = 'laporanpembelian.jrxml'
      WHERE file_name = 'LaporanPembelian.rpt'
    `);

        console.log('Update result:', result);

        // Verify
        const check = await conn.query('SELECT * FROM ReportDefinitions');
        console.log('Report Definitions:', check);

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (conn) await conn.close();
    }
}

updateReportFile();
