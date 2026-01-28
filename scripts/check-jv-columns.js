import { executeQuery } from '../server/index.js';

async function checkColumns() {
    try {
        console.log('Checking JournalVouchers columns...');
        const jvCols = await executeQuery("SELECT cname, coltype, length, nulls FROM SYS.SYSCOLUMNS WHERE creator = 'DBA' AND tname = 'JournalVouchers'");
        console.log('JV Columns:', JSON.stringify(jvCols, null, 2));

        console.log('Checking JournalVoucherDetails columns...');
        const jvdCols = await executeQuery("SELECT cname, coltype, length, nulls FROM SYS.SYSCOLUMNS WHERE creator = 'DBA' AND tname = 'JournalVoucherDetails'");
        console.log('JVD Columns:', JSON.stringify(jvdCols, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkColumns();
