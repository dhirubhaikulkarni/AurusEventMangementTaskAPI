const crypto = require("crypto");

const secretKey = "12345678901234567890123456789012"; // 32-byte key
const iv = Buffer.from("1234567890123456"); // 16-byte IV

// Function to encrypt data
exports.encryptData = (data) => {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secretKey), iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString("base64");

};

// Function to decrypt data
exports.decryptData = (encryptedData) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(secretKey), iv);
    let decrypted = decipher.update(Buffer.from(encryptedData, "base64"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
};