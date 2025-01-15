const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { Authentication } = require("../Authentication/Authentication");
const ObjectID = require('mongodb').ObjectId;

router.get("/eventType",Authentication, async (req, res) => {
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const eventtypes = await db.collection("EventTypes");
        let result = await eventtypes.find().toArray();
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Failed");
    }
});
router.get("/usersDetails",Authentication, async (req, res) => {
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const eventtypes = await db.collection("Users");
        let result = await eventtypes.find().toArray();
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Failed");
    }
});
router.get("/getEvents",Authentication, async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default page is 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default limit is 10 items per page

    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const events = await db.collection("Events");
        // let result = await events.find().toArray();
        let result = await events.aggregate([
            {
                $lookup: {
                    from: "Users", // The collection to join with
                    localField: "eventUser", // Field from the "Events" collection
                    foreignField: "_id", // Field from the "Users" collection
                    as: "userDetails" // The name of the new array field to be added
                }
            },
            {
                $lookup: {
                    from: "EventTypes", // The collection to join with
                    localField: "eventType", // Field from the "Events" collection
                    foreignField: "_id", // Field from the "Categories" collection
                    as: "categoryDetails" // The name of the new array field to be added
                }
            },
            {
                $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } // Optional if you want to flatten the "userDetails" array
            },
            {
                $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } // Optional if you want to flatten the "categoryDetails" array
            },
            {
                $skip: (page - 1) * limit // Skip based on current page and limit
            },
            {
                $limit: limit // Limit the number of events returned per page
            }

        ]).toArray();

        const totalEvents = await events.countDocuments();

        res.status(200).send({
            result,
            totalEvents,
            totalPages: Math.ceil(totalEvents / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).send("Failed");
    }
});
router.post("/createEvent",Authentication, async (req, res) => {
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
        res.status(200).send("Success");
    } catch (error) {
        res.status(500).send("Failed");
    }
});

router.put("/editEvent/:id",Authentication, async (req, res) => {
    try {
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

        return res.status(200).send({ newData: updatedPost, message: "Post Updated Successfully" });

    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send({ message: "Failed to update post" });
    }
});

router.delete("/:_id",Authentication, async (req, res) => {
    try {
        const dbConnection = await global.clientConnection;
        const db = await dbConnection.db("AurusCodeChallenge");
        const events = await db.collection("Events");
        const result = await events.deleteOne({ _id: new ObjectID(req.params._id) })

        if (!result) {
            return res.status(500).send({ data: { message: error.message } });
        } else {
            return res.status(200).send({ "message": "Events Deleted Successfully" });
        }
    }

    catch (error) {
        return res.status(500).send(encrypt(JSON.stringify({ data: { message: error.message } })));
    }
});



module.exports = router;