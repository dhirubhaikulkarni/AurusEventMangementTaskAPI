const router = require("express").Router();
const bcrypt = require("bcryptjs");
const ObjectID = require('mongodb').ObjectId;
const jwt = require("jsonwebtoken");
const { decryptData, encryptData } = require("../security/crypto");

const checkValueEmptyOrNull = (value) => {
    return (value === undefined || value === null || value === "" || value === "NULL" || value === "null") ? false : true;
}

router.post("/login", async (req, res) => {
    req.body = decryptData(req.body.data);
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const users = await db.collection("Users");

        const user = await users.findOne({ email: req.body.email });
        if (!checkValueEmptyOrNull(user)) {
            return res.status(200).send({ error: { code: "Failed", message: "User Does Not Exist credentials" } });
        }

        const compare = await bcrypt.compare(req.body.password, user.password);
        if (!compare) {
            return res.status(200).send({ error: { code: "Failed", message: "Incorrect credentials" } });
        }

        const token = jwt.sign({
            id: user._id,
            role: user.role,
            email: user.email,
            username: user.username

        },
            process.env.JWT_PRIVATEKEY,
            {
                expiresIn: process.env.JWT_EXPIRESIN
            }
        );

        let userData = {
            user,
            token
        }

        res.status(200).send(encryptData(userData)); // Send the user data on successful login
    } catch (error) {
        res.status(500).send(encryptData(error));
    }
});



module.exports = router;