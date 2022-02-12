const mongoose = require("mongoose");

const CompanySchema = mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Companies", CompanySchema, "companies");
