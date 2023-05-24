const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema(
  {
    CourseName: String,
    CourseDescription: String,
    CourseStart_date: Date,
    CourseEnd_date: Date,
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Course = mongoose.model("Course", CourseSchema);
module.exports = Course;
