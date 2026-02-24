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

            // 1. Remove getSelectedCurrencyCode function
            const getSelectedCurrencyCodePattern = /const\s+getSelectedCurrencyCode\s*=\s*\(\)\s*=>\s*\{[\s\S]*?return\s+rate\s*\?\s*rate\.from_currency_code\s*:\s*'IDR';\s*\};\n*/g;
            content = content.replace(getSelectedCurrencyCodePattern, '');

            // 2. Update formatCurrency to use formData.currency_code
            const formatCurrencyPattern = /const\s+code\s*=\s*getSelectedCurrencyCode\(\);/g;
            const newFormatCurrencyCode = "const code = formData.currency_code || 'IDR';";
            content = content.replace(formatCurrencyPattern, newFormatCurrencyCode);

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated getSelectedCurrencyCode in ${file}`);
        }
    });
});
