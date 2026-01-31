const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes("app.get('/api/journals/:id'")) {
        console.log(`Found at line ${index + 1}: ${line}`);
    }
});
