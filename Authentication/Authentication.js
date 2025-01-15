const jwt = require("jsonwebtoken");
var jwkToPem = require('jwk-to-pem');
var axios = require('axios');


async function Authentication(req, res, next) {
  try {
    var token = getToken(req, res);
    jwt.verify(token, process.env.JWT_PRIVATEKEY, async function (err, decoded) {
      if (err) {
        res.status(401).send('TokenExpire');
      } else {
        next();
      }
    });
  } catch (ex) {
    res.status(401).send('TokenExpire');
  }
}

const getToken = (req, res) => {
  
  if (req.headers.authorization && (req.headers.authorization)?.split(' ')[0] === 'Bearer') {
    return (req.headers.authorization)?.split(' ')[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return res.status(401).send('TokenExpire');
};

module.exports.Authentication = Authentication;

