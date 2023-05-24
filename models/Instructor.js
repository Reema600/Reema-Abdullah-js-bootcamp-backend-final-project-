const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InstructorSchema = new Schema(
  {
    InstructorName: String,
    InstructorPassword: String,
    InstructorEmail: String,
  },
  {
    timestamps: true,
  }
);
const Instructor = mongoose.model("Instructor", InstructorSchema);
module.exports = Instructor;
