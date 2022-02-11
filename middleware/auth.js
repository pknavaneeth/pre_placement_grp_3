const User = require("../models/User");

let auth = (req, res, next) => {
  try {
    let token = req.cookies.auth;
    if (!token)
      return res.status(400).send({ error: true, message: "Token required" });
    User.findByToken(token, (err, user) => {
      if (err) throw err;
      if (!user)
        return res.json({
          error: true,
        });
      req.token = token;
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

let authWithHeader = (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;
    // console.log("Auth Header : ", authHeader);
    let splittedHeader = authHeader.split(" ");
    if (splittedHeader.length !== 2) {
      return res.status(400).send({ error: true, message: "JSON Malformed" });
    }
    if (!splittedHeader[1])
      return res.status(400).send({ error: true, message: "Token required" });
    User.findByToken(splittedHeader[1], (err, user) => {
      if (err) throw err;
      if (!user)
        return res.json({
          error: true,
        });
      req.token = splittedHeader[1];
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const authGenerator = (role) => {
  return (req, res, next) => {
    try {
      if (req.user.role !== role)
        return res.status(401).send({
          error: true,
          message: "Unauthorized Access, API restricted to " + role + " users.",
        });
      next();
    } catch (error) {
      return res.status(500).send({ error: true, message: error.message });
    }
  };
};
module.exports = { auth, authGenerator, authWithHeader };
