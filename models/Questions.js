const mongoose = require("mongoose");

const questionSchema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Types.ObjectId,
    },
    question: {
      type: String,
      required: true,
    },
    raisedBy: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    companyName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

questionSchema.virtual("answers", {
  ref: "Answer",
  localField: "_id",
  foreignField: "questionId",
});

questionSchema.set("toObject", { virtuals: true });
questionSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Question", questionSchema);
