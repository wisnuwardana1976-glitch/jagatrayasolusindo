import { executeQuery } from '../server/index.js';

async function checkDuplicate() {
    try {
        const docNum = 'BCAI/012026/0002';
        console.log(`Checking for duplicate: ${docNum}`);
        const res = await executeQuery(`SELECT id, doc_number FROM JournalVouchers WHERE doc_number = '${docNum}'`);
        console.log('Result:', JSON.stringify(res, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDuplicate();
