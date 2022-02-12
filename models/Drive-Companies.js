const mongoose = require("mongoose");

const DriveCompaniesSchema = mongoose.Schema(
  {
    companyId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Companies",
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Drive-Companies",
  DriveCompaniesSchema,
  "drive-companies"
);
