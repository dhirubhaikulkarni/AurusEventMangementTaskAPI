const router = require("express").Router();
const bcrypt = require("bcryptjs");
const ObjectID = require('mongodb').ObjectId;

router.post("/register", async (req, res) => {
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
            email: req.body.email,
            role: "user",
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            contactNumber: req.body.contactNumber,
            createdAt: new Date()
        };

        let result = await users.insertOne(user);
        res.status(200).send("Success");
    } catch (error) {
        res.status(500).send("Failed");
    }
});




module.exports = router;