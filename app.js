const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const saltRounds = 10;
// const myPlaintextPassword = "s0//P4$$w0rD";
// const someOtherPlaintextPassword = "not_bacon";
const Instructor = require("./models/Instructor");
const Course = require("./models/Course");
const Student = require("./models/Student");
const Principal = require("./models/Principal");
const app = express();
app.set("View engine", "ejs");
app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "my secret",
  })
);
app.use(cookieParser());
app.use(express.json());

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("connection succsedd");
  })
  .catch(() => {
    console.log("**************error************");
  });

const isLoggedIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const object = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.object = object;
    next();
  } catch (err) {
    res.json({ errorMessage: err });
  }
};

const checkBlogAuthor = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const object = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.object = object;
    const studentLog = object.studentLog.id;

    Student.findById(studentLog)
      .then((foundStudent) => {
        console.log(foundStudent._id + "foundStudent._id");
        console.log(studentLog + "studentLog");
        if (foundStudent._id == studentLog) {
          next();
        } else {
          res.json({ errorMessage: "unauthorized" });
        }
      })
      .catch((err) => {
        res.json({ errorMessage: "not found" });
      });
  } catch (err) {
    res.json({ errorMessage: err });
  }
};
app.get("/", (req, res) => {
  res.render("index.ejs");
});
//**************************Instructor Side******************

app.get("/registerForm", (req, res) => {
  res.render("registerForm.ejs");
});
app.get("/instructorInfo", (req, res) => {
  Instructor.find().then((Instructors) => {
    res.render("instructorInfo.ejs", { Instructors: Instructors });
  });
});

app.post("/register", (req, res) => {
  const InstructorName = req.body.InstructorName;
  const InstructorPassword = req.body.InstructorPassword;
  const InstructorEmail = req.body.InstructorEmail;

  bcrypt.hash(InstructorPassword, saltRounds).then((encryptedpassword) => {
    Instructor.create({
      InstructorName: InstructorName,
      InstructorPassword: encryptedpassword,
      InstructorEmail: InstructorEmail,
    }).then((createdInstructor) => {
      res.redirect("/instructorInfo");
    });
  });
});
app.get("/loginForm", (req, res) => {
  res.render("loginForm.ejs");
});

app.post("/login", (req, res) => {
  const InstructorName = req.body.InstructorName;
  const InstructorPassword = req.body.InstructorPassword;

  Instructor.findOne({ InstructorName })
    .select("+InstructorPassword")
    .then((foundInstructor) => {
      if (!foundInstructor) {
        res.send("Instructor not found");
        return;
      }
      const encryptedpassword = foundInstructor.InstructorPassword;

      bcrypt
        .compare(InstructorPassword, encryptedpassword)
        .then((response) => {
          if (response == true) {
            req.session.InstructorId = foundInstructor._id;
            // res.send(foundInstructor);
            res.redirect("/instructorInfo");
          } else {
            res.send("incorrect password");
          }
        })
        .catch((err) => {
          res.send(err);
        });
    });
});

//**************************Course******************
app.get("/addCourseForm", (req, res) => {
  res.render("addCourseForm.ejs");
});

app.post("/addCourse", (req, res) => {
  const c = new Course({
    CourseName: req.body.CourseName,
    CourseDescription: req.body.CourseDescription,
    CourseStart_date: req.body.CourseStart_date,
    CourseEnd_date: req.body.CourseEnd_date,
  });

  c.save()
    .then(() => {
      res.redirect("/allCourses");
    })
    .catch(() => {
      res.send("error");
    });
});

// READ (ALL Courses):
app.get("/allCourses", (req, res) => {
  Course.find().then((courses) => {
    res.render("allCourses.ejs", { allCourses: courses });
  });
});
// Show  Course Details
app.get("/courseDetails/:courseId", (req, res) => {
  const courseId = req.params.courseId;

  Course.findById(courseId)
    .then((courses) => {
      res.render("csourseDetails.ejs", { courses: courses });
    })
    .catch(() => {
      res.send("error");
    });
});
// Remove Course
app.get("/removeCourse/:courseId", (req, res) => {
  const courseId = req.params.courseId;
  Course.findByIdAndDelete(courseId)
    .then(() => {
      res.redirect("/allCourses");
    })
    .catch(() => {
      res.send("error");
    });
});
// Update Course
app.get("/updateCourseForm", (req, res) => {
  res.render("updateCourseForm.ejs");
});
app.get("/editCourse/:courseId", (req, res) => {
  const courseId = req.params.courseId;
  Course.findById(courseId)
    .then((returnedCourse) => {
      res.render("updateCourseForm.ejs", { c: returnedCourse });
    })
    .catch((err) => {
      res.send(err.message);
    });
});
app.post("/UpdateCourse/:courseId", (req, res) => {
  const courseId = req.params.courseId;
  Course.findById(courseId).then((foundCourse) => {
    const CourseName = req.body.newCourseName;
    foundCourse.CourseName = CourseName;

    const CourseDescription = req.body.newCourseDescription;
    foundCourse.CourseDescription = CourseDescription;

    const CourseStart_date = req.body.newCourseStart_date;
    foundCourse.CourseStart_date = CourseStart_date;

    const CourseEnd_date = req.body.newCourseEnd_date;
    foundCourse.CourseEnd_date = CourseEnd_date;
    foundCourse.save().then(() => {
      res.redirect("/allCourses");
    });
  });
});

//***************************Student Side*********************

app.post("/api/register", (req, res) => {
  let StudentName = req.body.StudentName;
  let StudentPassword = req.body.StudentPassword;

  bcrypt.hash(StudentPassword, saltRounds).then((encryptedpassword) => {
    Student.create({
      StudentName: StudentName,
      StudentPassword: encryptedpassword,
    }).then((createdStudent) => {
      // res.json("created successfully");
      const token = jwt.sign({ createdStudent }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ Student: createdStudent, token: token });
    });
  });
});
app.post("/api/login", (req, res) => {
  const StudentName = req.body.StudentName;
  const StudentPassword = req.body.StudentPassword;

  Student.findOne({ StudentName })
    .select("+StudentPassword")
    .then((foundStudent) => {
      if (!foundStudent) {
        res.status(401).json({ errorMessage: "incorrect StudentName" });
        return;
      }

      const encryptedPassword = foundStudent.StudentPassword;

      bcrypt
        .compare(StudentPassword, encryptedPassword)
        .then((response) => {
          if (response == true) {
            const token = jwt.sign(
              {
                studentLog: {
                  StudentName: foundStudent.StudentName,
                  id: foundStudent._id,
                },
              },
              process.env.JWT_SECRET,
              {
                expiresIn: "1h",
              }
            );
            res.json({ Student: foundStudent, token: token });
          } else {
            res.status(401).json({ errorMessage: "incorrect password" });
          }
        })
        .catch((errorMessage) => {
          res.status(401).json({ errorMessage });
        });
    })
    .catch((errorMessage) => {
      res.status(401).json({ errorMessage });
    });
});

//student Register In Courses
app.post("/studentRegisterInCourses", isLoggedIn, function (req, res) {
  let courseId = req.body.courseID;
  const object = res.locals.object;
  const studentLog = object.studentLog.id;
  Course.findById(courseId).then((returnedcourse) => {
    Student.findById(studentLog).then((foundStudent) => {
      foundStudent.courses.push(courseId);
      returnedcourse.students.push(foundStudent);
      returnedcourse.save().then(() => {
        foundStudent
          .save()
          .then((value) => {
            value.populate("courses").then((students) => {
              res.json({ students });
            });
          })
          .catch((error) => {
            res.status(401).json({ errorMessage: error.message });
          });
      });
    });
  });
});
// list all courses for Student
app.get("/api/Student/:studentId/allCourses", isLoggedIn, (req, res) => {
  try {
    const object = res.locals.object;
    res.locals.object = object;

    if (object.studentLog.id != req.params.studentId) {
      return res.json({ errorMessage: "unauthorized" });
    }
    const id = req.params.studentId;
    Course.find({ students: id }).then((foundCourse) => {
      res.status(200).json(foundCourse);
    });
  } catch (err) {
    res.json({ errorMessage: err });
  }
});
//cancel the registration from the course
app.delete(
  "/api/deleteCourse/:CourseId",isLoggedIn,checkBlogAuthor,(req, res) => {
    const CourseId = req.params.CourseId;
    Blog.findById(CourseId)
      .then((deleteCourse) => {
        res.json({ deleteCourse });
      })
      .catch((err) => {
        res.json({ errMessage: err });
      });
  }
);
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.get("/Principal", (req, res) => {
  const principal = new Principal({
    PrincipalName: "omar",
    PrincipalPassword: "1213",
  });

  principal
    .save()
    .then(() => {
      res.redirect("/principal");
    })
    .catch(() => {
      res.send("error");
    });
});

app.post("/login", (req, res) => {
  const PrincipalName = req.body.PrincipalName;
  const PrincipalPassword = req.body.PrincipalPassword;

  Principal.findOne({ PrincipalName })
    .select("+PrincipalPassword")
    .then((foundPrincipal) => {
      if (!foundPrincipal) {
        res.send("Principal not found");
        return;
      }
      const encryptedpassword = foundPrincipal.PrincipalPassword;

      bcrypt
        .compare(PrincipalPassword, encryptedpassword)
        .then((response) => {
          if (response == true) {
            req.session.PrincipalId = foundPrincipal._id;
            // res.send(foundInstructor);
            res.redirect("/instructorInfo");
          } else {
            res.send("incorrect password");
          }
        })
        .catch((err) => {
          res.send(err);
        });
    });
});

//****************************************************************
app.listen(8888, () => {
  console.log("listining");
});
