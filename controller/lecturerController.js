const User = require("../models/User.js");
const Answers = require("../models/Answers.js");
const Questions = require("../models/Questions.js");

const onBoardJuniorsController = function (req, res) {
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
};

const listJuniorsController = function (req, res) {
  try {
    User.find({ role: "Junior" }, (err, juniors) => {
      if (err) throw err;
      return res.status(200).json({ juniors });
    }).select("email firstname lastname createdAt");
  } catch (err) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const validStatus = ["Approved", "Rejected", "Pending"];

const viewAnswersController = async function (req, res) {
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
};

const approveAnswerController = async function (req, res) {
  try {
    let payload = req.body;
    if (!payload.answerId || !payload.status)
      return res.status(400).send({ error: true, message: "Invalid payload" });
    if (!validStatus.includes(payload.status))
      return res.status(400).send({
        error: true,
        message: `Status ${payload.status} is invalid`,
      });
    let answer = await Answers.findById(payload.answerId);
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
};

module.exports = {
  onBoardJuniorsController,
  listJuniorsController,
  viewAnswersController,
  approveAnswerController,
};
