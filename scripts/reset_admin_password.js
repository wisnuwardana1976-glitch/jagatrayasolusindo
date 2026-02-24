
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function resetPassword() {
    let connection;
    try {
        const newPassword = 'admin123'; // New password set to admin123
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        console.log(`Resetting password for user 'admin' to '${newPassword}'...`);

        connection = await odbc.connect(connectionString);

        // Check if user exists first
        const users = await connection.query("SELECT * FROM Users WHERE username = 'admin'");
        if (users.length === 0) {
            console.error("User 'admin' not found!");
            return;
        }

        await connection.query(
            "UPDATE Users SET password_hash = ? WHERE username = 'admin'",
            [hashedPassword]
        );

        console.log("✅ Password successfully reset to 'admin'");
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

resetPassword();
