const Question = require("../models/Questions.js");
const Answer = require("../models/Answers.js");

const postAnswersController = async function (req, res) {
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
};

const viewQuestionsController = async function (req, res) {
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
    return res.status(200).json({ status: true, questions, pageNo, noOfPages });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

module.exports = { postAnswersController, viewQuestionsController };
