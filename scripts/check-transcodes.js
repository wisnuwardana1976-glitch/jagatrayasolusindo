
const { executeQuery } = require('./server/db');

async function run() {
    try {
        const res = await executeQuery(`SELECT * FROM Transcodes`);
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
