
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
  let connection;
  try {
    connection = await odbc.connect(connectionString);

    console.log('Testing Query 1: explicit * and subquery');
    // Sybase: SELECT TOP 1 ...
    // Also JournalVouchers.* might need table name if * used with others?
    const q1 = `
          SELECT TOP 1 (SELECT SUM(d.debit) FROM JournalVoucherDetails d WHERE d.jv_id = JournalVouchers.id) as total_amount,
          *
          FROM JournalVouchers
        `;
    const res1 = await connection.query(q1);
    console.log('Keys 1:', Object.keys(res1[0]));
    console.log('Value 1:', res1[0].total_amount);

    console.log('\nTesting Query 2: Specific columns');
    const q2 = `
          SELECT TOP 1 id, doc_number,
          (SELECT SUM(d.debit) FROM JournalVoucherDetails d WHERE d.jv_id = JournalVouchers.id) as total_amount
          FROM JournalVouchers
        `;
    const res2 = await connection.query(q2);
    console.log('Keys 2:', Object.keys(res2[0]));
    console.log('Value 2:', res2[0].total_amount);

  } catch (error) {
    console.error(error);
  } finally {
    if (connection) await connection.close();
  }
}
run();
