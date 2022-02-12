const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const confiq = require("../config").get(process.env.NODE_ENV);
const salt = 10;
var mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      maxlength: 100,
    },
    lastname: {
      type: String,
      required: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    password2: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      required: true,
    },
    yearsOfExp: {
      type: Number,
      required: false,
    },
    companyName: {
      type: String,
      required: false,
    },
    token: {
      type: String,
    },
  },
  { timestamps: true }
);

//To encrypt the password
userSchema.pre("save", function (next) {
  var user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(salt, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        user.password2 = hash;
        next();
      });
    });
  } else {
    next();
  }
});

// To compare entered password and the saved encrypted password
userSchema.methods.comparepassword = function (password, cb) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) return cb(next);
    cb(null, isMatch);
  });
};

// generate token

userSchema.methods.generateToken = function (cb) {
  var user = this;
  var token = jwt.sign(user._id.toHexString(), confiq.SECRET); //confiq.SECRET);
  user.token = token;
  user.save(function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};

// find by token - To check if user is used-in or not
userSchema.statics.findByToken = function (token, cb) {
  var user = this;
  jwt.verify(token, confiq.SECRET, function (err, decode) {
    if (err) return cb(err);
    user.findOne({ _id: decode, token: token }, function (err, user) {
      if (err) return cb(err);
      return cb(null, user);
    });
  });
};

//delete token - to delete after the user has logged out
userSchema.methods.deleteToken = function (token, cb) {
  var user = this;
  user.update({ $unset: { token: 1 } }, function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};

module.exports = mongoose.model("User", userSchema);
