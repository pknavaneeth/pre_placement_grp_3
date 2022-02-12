const mongoose = require("mongoose");

const AnswerSchema = mongoose.Schema(
  {
    questionId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Question",
    },
    answer: {
      type: String,
      required: true,
    },
    authorId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", AnswerSchema);
