const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const db = require("./config").get(process.env.NODE_ENV);
const User = require("./models/User");
const Companies = require("./models/Companies.js");
const Answers = require("./models/Answers.js");
const DriveCompanies = require("./models/Drive-Companies.js");
const Question = require("./models/Questions");
const Answer = require("./models/Answers.js");
const { auth, authGenerator, authWithHeader } = require("./middleware/auth");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
// app use
app.use(morgan("combined"));
app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());

// database connection
mongoose.Promise = global.Promise;
mongoose.connect(
  db.DATABASE,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (err) console.log(err);
    console.log("database is connected");
  }
);

app.get("/", function (req, res) {
  res.status(200).send(`Welcome to login , sign-up api`);
});

// listening port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`app is live at ${PORT}`);
});

// adding new user (sign-up route)
app.post("/api/register", function (req, res) {
  // taking a user
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
});

// login for any user
app.post("/api/login", function (req, res) {
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
        });
      });
    });
  });
});

// get logged in user profile
app.get("/api/profile", authWithHeader, function (req, res) {
  res.status(200).json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.firstname + req.user.lastname,
    role: req.user.role,
  });
});

//logout user
app.get("/api/logout", authWithHeader, function (req, res) {
  req.user.deleteToken(req.token, (err, user) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

//api to create junior user credentials
app.post(
  "/api/lecturer/onboard-junior",
  authWithHeader,
  authGenerator("Lecturer"),
  function (req, res) {
    try {
      let userDetails = req.body;
      userDetails.role = "Junior";
      userDetails.password2 = userDetails.password;
      const newuser = new User(userDetails);
      newuser.save((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ success: false, message: err.message });
        }
        doc.password = userDetails.password;
        res.status(200).json({
          succes: true,
          user: doc,
        });
      });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

//api to show list of junior accounts to Lecturer
app.get(
  "/api/list-juniors",
  authWithHeader,
  authGenerator(["Lecturer", "PO"]),
  function (req, res) {
    try {
      User.find({ role: "Junior" }, (err, juniors) => {
        if (err) throw err;
        return res.status(200).json({ juniors });
      }).select("email firstname lastname createdAt");
    } catch (err) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

//api to show list of companies participating in drive (api for placement officer and junior)
app.get("/api/listcompanies", authWithHeader, async function (req, res) {
  try {
    let companyList = await DriveCompanies.find().populate({
      path: "companyId",
      select: "-_id",
    });
    let companyArray = [];
    companyList.forEach((value) => {
      companyArray.push(value.companyId.companyName);
    });
    return res.status(200).send(companyArray);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//api to post questions for juniors
app.post(
  "/api/post-question",
  authWithHeader,
  authGenerator("Junior"),
  function (req, res) {
    try {
      req.body.raisedBy = req.user._id;
      const question = new Question(req.body);
      question.save((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ success: false });
        }
        res.status(200).json({
          succes: true,
          user: doc,
        });
      });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

//api to see questions and answers for juniors
app.get(
  "/api/get-question-answers",
  authWithHeader,
  authGenerator("Junior"),
  async function (req, res) {
    try {
      let queryParams = req.query;
      let query = {};
      if (queryParams.showAll === "false") {
        query = {
          raisedBy: req.user._id,
        };
      }
      let sortBy = queryParams.sortBy;
      let sortOrder = 1;
      if (queryParams.sortOrder == "des") sortOrder = -1;
      let sortObject = {};
      if (sortBy) sortObject[sortBy] = sortOrder;
      let pageNo = queryParams.pageNo;
      let perPage = queryParams.perPage;
      let count = await Question.find(query).countDocuments();
      // console.log(count);
      let noOfPages = Math.ceil(count / perPage);
      if (pageNo > noOfPages && pageNo != 1)
        return res
          .status(400)
          .send({ error: true, message: "Page not available" });
      let skip = perPage * (pageNo - 1);
      let questions = await Question.find(query)
        .populate({ path: "raisedBy", select: "firstname lastname -_id" })
        .populate({
          path: "answers",
          match: { status: "Approved" },
          populate: { path: "authorId", select: "firstname lastname -_id" },
          select: "-__v",
        })
        .select("-__v")
        .sort(sortObject)
        .limit(perPage)
        .skip(skip);
      return res
        .status(200)
        .json({ status: true, questions, pageNo, noOfPages });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

//api to post answer for seniors
app.post(
  "/api/post-answer",
  authWithHeader,
  authGenerator("Senior"),
  async function (req, res) {
    try {
      let question = await Question.findById(req.body.questionId).lean();
      if (!question)
        return res
          .status(404)
          .send({ error: true, message: "Question not found" });
      if (req.user.companyName !== question.companyName)
        return res.status(401).send({
          error: true,
          message:
            "Unauthorized,Answer only questions related to your current company.",
        });
      req.body.authorId = req.user._id;
      req.body.status = "Pending";
      const answer = new Answer(req.body);
      answer.save((err, doc) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }
        res.status(200).json({
          succes: true,
          user: doc,
        });
      });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

//api to view question and answers for seniors
app.get(
  "/api/senior/view-questions",
  authWithHeader,
  authGenerator("Senior"),
  async function (req, res) {
    try {
      let queryParams = req.query;
      let query = {};
      let sortBy = queryParams.sortBy;
      let sortOrder = 1;
      query.companyName = req.user.companyName;
      if (queryParams.sortOrder == "des") sortOrder = -1;
      let sortObject = {};
      if (sortBy) sortObject[sortBy] = sortOrder;
      let pageNo = queryParams.pageNo;
      let perPage = queryParams.perPage;
      let count = await Question.find(query).countDocuments();
      let noOfPages = Math.ceil(count / perPage);
      if (pageNo > noOfPages && pageNo != 1)
        return res
          .status(400)
          .send({ error: true, message: "Page not available" });
      let skip = perPage * (pageNo - 1);
      let questions = await Question.find(query)
        .populate({ path: "raisedBy", select: "firstname lastname -_id" })
        .populate({
          path: "answers",
          match: { authorId: req.user._id },
          populate: { path: "authorId", select: "firstname lastname -_id" },
          select: "-__v",
        })
        .select("-__v")
        .sort(sortObject)
        .limit(perPage)
        .skip(skip);
      return res
        .status(200)
        .json({ status: true, questions, pageNo, noOfPages });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

var validStatus = ["Approved", "Rejected", "Pending"];
// Api to view pending answers for faculty users
app.get(
  "/api/faculty/view-answers",
  authWithHeader,
  authGenerator("Lecturer"),
  async function (req, res) {
    try {
      let queryParams = req.query;
      let query = {};
      if (queryParams.status) {
        if (!validStatus.includes(queryParams.status))
          return res.status(400).send({
            error: true,
            message: `Status ${queryParams.status} is invalid`,
          });
        query.status = queryParams.status;
      }
      let sortBy = queryParams.sortBy;
      let sortOrder = 1;
      query.companyName = req.user.companyName;
      if (queryParams.sortOrder == "des") sortOrder = -1;
      let sortObject = {};
      if (sortBy) sortObject[sortBy] = sortOrder;
      let pageNo = queryParams.pageNo;
      let perPage = queryParams.perPage;
      let count = await Answers.find(query).countDocuments();
      let noOfPages = Math.ceil(count / perPage);
      if (pageNo > noOfPages && pageNo != 1)
        return res
          .status(400)
          .send({ error: true, message: "Page not available" });
      let skip = perPage * (pageNo - 1);
      let answers = await Answers.find(query)
        .populate({ path: "authorId", select: "firstname lastname -_id" })
        .populate({
          path: "questionId",
          populate: { path: "raisedBy", select: "firstname lastname -_id" },
          select: "-__v",
        })
        .select("-__v")
        .sort(sortObject)
        .limit(perPage)
        .skip(skip);
      return res.status(200).json({ status: true, answers, pageNo, noOfPages });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

// Approve answer by Lecturer
app.post(
  "/api/faculty/answer-change-status",
  authWithHeader,
  authGenerator("Lecturer"),
  async function (req, res) {
    try {
      let payload = req.body;
      if (!payload.answerId || !payload.status)
        return res
          .status(400)
          .send({ error: true, message: "Invalid payload" });
      if (!validStatus.includes(payload.status))
        return res.status(400).send({
          error: true,
          message: `Status ${payload.status} is invalid`,
        });
      let answer = await Answer.findById(payload.answerId);
      if (!answer)
        return res.status(404).send({
          error: true,
          message: "Answer Id is invalid",
        });
      if (answer.status == payload.status)
        return res.status(400).send({
          error: true,
          message: "Status same as requested",
        });
      answer.status = payload.status;
      let response = await answer.save();
      return res.status(200).send({ status: true, data: response });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

// Api for placement officer to get all registered companies
app.get(
  "/api/allcompanies",
  authWithHeader,
  authGenerator("PO"),
  async function (req, res) {
    try {
      let companyList = await Companies.find().lean();
      // let companyArray = [];
      // companyList.forEach((value) => {
      //   companyArray.push(value.companyName);
      // });
      return res.status(200).send({ status: true, companyList });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

// Api for placement officer to add companies to drive
app.get(
  "/api/companiesfordrive/:companyId",
  authWithHeader,
  authGenerator("PO"),
  async function (req, res) {
    try {
      let companyId = mongoose.Types.ObjectId.createFromHexString(
        req.params.companyId
      );
      let company = await Companies.findById(companyId);
      if (!company)
        return res
          .status(404)
          .json({ error: true, message: "Company not found" });
      let driveCompanies = await DriveCompanies.findOne({ companyId });
      if (driveCompanies)
        return res
          .status(400)
          .json({ error: true, message: "Company already added" });
      let newInsert = await DriveCompanies.create({ companyId });
      return res.status(201).send({ status: true, newInsert });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

// Api for placement officer to delete companies to drive
app.delete(
  "/api/companiesfordrive/:companyId",
  authWithHeader,
  authGenerator("PO"),
  async function (req, res) {
    try {
      let companyId = mongoose.Types.ObjectId.createFromHexString(
        req.params.companyId
      );
      let company = await Companies.findById(companyId);
      if (!company)
        return res
          .status(404)
          .json({ error: true, message: "Company not found" });
      let driveCompanies = await DriveCompanies.findOne({ companyId });
      if (!driveCompanies)
        return res
          .status(400)
          .json({ error: true, message: "Company already removed" });
      let deleteStatus = await DriveCompanies.findOneAndDelete({ companyId });
      return res.status(201).send({ status: true, deleteStatus });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

app.post(
  "/api/po/convert-to-senior",
  authWithHeader,
  authGenerator("PO"),
  async function (req, res) {
    try {
      let body = req.body;
      if (!body.userId || !body.companyName)
        return res
          .status(400)
          .send({ error: true, message: "Invalid request body" });
      let userDetails = await User.findById(
        mongoose.Types.ObjectId.createFromHexString(body.userId)
      );
      if (!userDetails)
        return res.status(404).send({ error: true, message: "User not found" });
      if (userDetails.role !== "Junior")
        return res
          .status(404)
          .send({ error: true, message: "User is not a junior" });
      userDetails.role = "Senior";
      userDetails.companyName = body.companyName;
      let upgradeStatus = await userDetails.save();
      return res.status(200).send({ status: true, upgradeStatus });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);
