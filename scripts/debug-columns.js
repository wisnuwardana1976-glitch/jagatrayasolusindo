import { executeQuery } from '../server/index.js';

async function run() {
    try {
        console.log('QUERY START');
        const res = await executeQuery("SELECT cname, coltype, length, nulls FROM SYS.SYSCOLUMNS WHERE tname = 'JournalVouchers'");
        console.log('COLS:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
setTimeout(run, 2000); // Wait for DB connection
