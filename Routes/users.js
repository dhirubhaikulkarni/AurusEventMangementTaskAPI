const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { encryptData, decryptData } = require("../security/crypto");
const ObjectID = require('mongodb').ObjectId;

router.post("/register", async (req, res) => {
    req.body = decryptData(req.body.data);
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const users = await db.collection("Users");

        // Check if user with provided email exists
        const existingEmailUser = await users.findOne({ email: req.body.email });
        if (existingEmailUser) {
            return res.status(400).send("Email is already registered.");
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        const user = {
            password: hashPassword,
            email: req.body.email.toLowerCase(),
            role: "user",
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            contactNumber: req.body.contactNumber,
            createdAt: new Date()
        };

        let result = await users.insertOne(user);
        let data = {
            result,
            message: "User registered successfully"
        }
        res.status(200).send(encryptData(data));
    } catch (error) {
        res.status(500).send(encryptData(error));
    }
});




module.exports = router;