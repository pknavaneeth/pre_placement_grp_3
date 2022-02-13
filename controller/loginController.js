const User = require("../models/User.js");

const signUpController = function (req, res) {
  const newuser = new User(req.body);

  if (newuser.password != newuser.password2)
    return res.status(400).json({ message: "password not match" });

  if (newuser.role == "Senior" && !newuser.companyName)
    return res.status(400).json({ message: "Please enter company name" });

  if (newuser.role == "Lecturer" && !newuser.yearsOfExp)
    return res.status(400).json({ message: "Please enter number of years" });

  User.findOne({ email: newuser.email }, function (err, user) {
    if (user)
      return res.status(400).json({ auth: false, message: "email exits" });

    newuser.save((err, doc) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ success: false });
      }
      res.status(200).json({
        succes: true,
        user: doc,
      });
    });
  });
};

const loginController = function (req, res) {
  try {
    User.findOne({ email: req.body.email }, function (err, user) {
      if (!user)
        return res.json({
          isAuth: false,
          message: " Auth failed ,email not found",
        });

      user.comparepassword(req.body.password, (err, isMatch) => {
        if (!isMatch)
          return res.json({
            isAuth: false,
            message: "password doesn't match",
          });

        user.generateToken((err, user) => {
          if (err) return res.status(400).send(err);
          res.status(200).json({
            isAuth: true,
            id: user._id,
            email: user.email,
            token: user.token,
            role: user.role,
            companyName: user.companyName,
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const profileController = function (req, res) {
  try {
    res.status(200).json({
      isAuth: true,
      id: req.user._id,
      email: req.user.email,
      name: req.user.firstname + req.user.lastname,
      role: req.user.role,
      companyName: req.user.companyName,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const logoutController = function (req, res) {
  req.user.deleteToken(req.token, (err, user) => {
    if (err) return res.status(400).send(err);
    res.status(200).send({ status: true });
  });
};

module.exports = {
  signUpController,
  loginController,
  profileController,
  logoutController,
};
