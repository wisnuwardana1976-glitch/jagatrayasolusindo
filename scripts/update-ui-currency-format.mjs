import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, '../src/pages/transaction');

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach(function (file) {
        if (file.endsWith('List.jsx')) {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Replace the complex exchange rate description with standard currency format
            const oldPattern = /\{er\.description\}\s*\(\{er\.rate_type_name\}\)\s*—\s*\{er\.from_date\}\s*s\/d\s*\{er\.to_date\}/g;
            const newPattern = "{er.code} - {er.name}";

            if (oldPattern.test(content)) {
                content = content.replace(oldPattern, newPattern);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    });
});
