const Companies = require("../models/Companies.js");
const DriveCompanies = require("../models/Drive-Companies.js");
const User = require("../models/User.js");
const mongoose = require("mongoose");

const getRegisteredCompaniesController = async function (req, res) {
  try {
    let companyList = await Companies.find().lean();
    return res.status(200).send({ status: true, companyList });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const addCompaniesToDriveController = async function (req, res) {
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
};

const deleteCompaniesToDriveController = async function (req, res) {
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
};

const convertSeniorToJuniorController = async function (req, res) {
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
};
module.exports = {
  getRegisteredCompaniesController,
  addCompaniesToDriveController,
  deleteCompaniesToDriveController,
  convertSeniorToJuniorController,
};
