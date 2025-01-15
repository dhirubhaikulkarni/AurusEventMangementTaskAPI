const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const users = require("./Routes/users");
const auth = require("./Routes/auth");
const event = require("./Routes/events");



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, access_token"
  );
  next();
});


app.use("/api/users", users)
app.use("/api/auth", auth)
app.use("/api/events", event)




global.clientConnection = new MongoClient(process.env.MONGODB_CONNECT_URI, { useNewUrlParser: true, useUnifiedTopology: true });



var server = require("http").createServer(app)

server.listen(process.env.PORT, () => console.log(`listening on port 4000...`));

module.exports = app;
