const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { Authentication } = require("../Authentication/Authentication");
const { decryptData, encryptData } = require("../security/crypto");
const ObjectID = require('mongodb').ObjectId;

router.get("/eventType", Authentication, async (req, res) => {
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const eventtypes = await db.collection("EventTypes");
        let result = await eventtypes.find().toArray();
        res.status(200).send(encryptData(result));
    } catch (error) {
        res.status(500).send("Failed");
    }
});
router.get("/usersDetails", Authentication, async (req, res) => {
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const users = await db.collection("Users");
        const query = { role: { $ne: "admin" } };
        const result = await users.find(query).toArray();
        res.status(200).send(encryptData(result));
    } catch (error) {
        res.status(500).send("Failed");
    }
});
router.get("/", Authentication, async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default page is 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default limit is 10 items per page
    const searchTerm = req.query.searchTerm || ""; // Event name search
    const startDate = req.query.startDate; // Start date filter
    const endDate = req.query.endDate; // End date filter
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const events = await db.collection("Events");

        // Build the match conditions dynamically
        const matchConditions = {};

        // Add search term condition if provided
        if (searchTerm) {
            matchConditions.title = { $regex: searchTerm, $options: "i" }; // Case-insensitive regex
        }

        // Add date range condition if provided
        if (startDate || endDate) {
            matchConditions.startDate = {};
            if (startDate) {
                matchConditions.startDate.$gte = new Date(startDate); // Greater than or equal to startDate
            }
            if (endDate) {
                matchConditions.startDate.$lte = new Date(endDate); // Less than or equal to endDate
            }
        }

        // Aggregation pipeline with filtering and pagination
        const pipeline = [
            ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []), // Only add $match if filters exist
            {
                $lookup: {
                    from: "Users",
                    localField: "eventUser",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: "EventTypes",
                    localField: "eventType",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true }
            },
            { $sort: { startDate: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        const result = await events.aggregate(pipeline).toArray();

        // Total documents count (with or without filters)
        const totalEvents = await events.countDocuments(Object.keys(matchConditions).length > 0 ? matchConditions : {});
        let data = {
            result,
            totalEvents,
            totalPages: Math.ceil(totalEvents / limit),
            currentPage: page
        }
        res.status(200).send(encryptData(data));
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).send("Failed");
    }
});

router.post("/createEvent", Authentication, async (req, res) => {
    req.body = decryptData(req.body.data);
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const Event = await db.collection("Events");

        const EventData = {
            title: req.body.title,
            content: req.body.content,
            eventType: new ObjectID(req.body.selectedCategory),
            eventUser: new ObjectID(req.body.selectedUser),
            location: req.body.location,
            address: req.body.address,
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            createdAt: new Date()
        };

        let result = await Event.insertOne(EventData);
        let data = {
            result,
            message: "Event Created successfully"
        }
        res.status(200).send(encryptData(data));
    } catch (error) {
        res.status(500).send("Failed");
    }
});

router.put("/editEvent/:id", Authentication, async (req, res) => {
    try {
        req.body = decryptData(req.body.data);
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const Event = db.collection("Events");

        const { id } = req.params;  // Get postId from URL
        const { title, selectedCategory, selectedUser, location, address, startDate, endDate, content } = req.body;


        const eventId = new ObjectID(id);
        await Event.updateOne(
            { _id: eventId },
            {
                $set: {
                    title,
                    content,
                    eventType: new ObjectID(selectedCategory),
                    eventUser: new ObjectID(selectedUser),
                    location,
                    address,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    updatedAt: new Date(),
                },
            }
        );

        const updatedPost = await Event.findOne({ _id: eventId });
        let data = {
            newData: updatedPost,
            message: "Event Updated Successfully"
        }
        return res.status(200).send(encryptData(data));

    } catch (error) {
        return res.status(500).send(encryptData("Failed to update event"));
    }
});

router.delete("/:_id", Authentication, async (req, res) => {
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const events = await db.collection("Events");
        const result = await events.deleteOne({ _id: new ObjectID(req.params._id) })
        let data = {
            message: "Post Updated Successfully"
        }
        if (!result) {
            return res.status(500).send(encryptData(error.message));
        } else {
            return res.status(200).send(encryptData(data));
        }
    }

    catch (error) {
        return res.status(500).send(encryptData(error));
    }
});



module.exports = router;