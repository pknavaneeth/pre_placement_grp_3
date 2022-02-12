const DriveCompanies = require("../models/Drive-Companies.js");
const Question = require("../models/Questions.js");

const listDriveCompaniesController = async function (req, res) {
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
};

const postQuestionController = function (req, res) {
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
};

const seeQAController = async function (req, res) {
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
    return res.status(200).json({ status: true, questions, pageNo, noOfPages });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
module.exports = {
  listDriveCompaniesController,
  postQuestionController,
  seeQAController,
};
