const express = require("express");
const loginRoutes = require("../controller/loginController.js");
const lecturerRoutes = require("../controller/lecturerController.js");
const juniorRoutes = require("../controller/juniorController.js");
const seniorRoutes = require("../controller/seniorController.js");
const poRoutes = require("../controller/poController.js");
const { authGenerator, authWithHeader } = require("../middleware/auth.js");

let router = express.Router();

//SignUp Routes
router.post("/api/register", loginRoutes.signUpController);

//Login Routes
router.post("/api/login", loginRoutes.loginController);

//Get Profile
router.get("/api/profile", authWithHeader, loginRoutes.profileController);

//Logout
router.get("/api/logout", authWithHeader, loginRoutes.logoutController);

//Lecturer Onboard Juniors
router.post(
  "/api/lecturer/onboard-junior",
  authWithHeader,
  authGenerator("Lecturer"),
  lecturerRoutes.onBoardJuniorsController
);

//List Juniors for Lecturer and PO
router.get(
  "/api/list-juniors",
  authWithHeader,
  authGenerator(["Lecturer", "PO"]),
  lecturerRoutes.listJuniorsController
);

//List Registered Drive companies ( for po and junior )
router.get(
  "/api/listcompanies",
  authWithHeader,
  juniorRoutes.listDriveCompaniesController
);

//Post question for Junior
router.post(
  "/api/post-question",
  authWithHeader,
  authGenerator("Junior"),
  juniorRoutes.postQuestionController
);

//See question and answer for juniors
router.get(
  "/api/get-question-answers",
  authWithHeader,
  authGenerator("Junior"),
  juniorRoutes.seeQAController
);

//Post answers for senior
router.post(
  "/api/post-answer",
  authWithHeader,
  authGenerator("Senior"),
  seniorRoutes.postAnswersController
);

//View question and answers for seniors
router.get(
  "/api/senior/view-questions",
  authWithHeader,
  authGenerator("Senior"),
  seniorRoutes.viewQuestionsController
);

// Api to view pending answers for lecturer users
router.get(
  "/api/faculty/view-answers",
  authWithHeader,
  authGenerator("Lecturer"),
  lecturerRoutes.viewAnswersController
);

//Approve answer by Lectuirer
router.post(
  "/api/faculty/answer-change-status",
  authWithHeader,
  authGenerator("Lecturer"),
  lecturerRoutes.approveAnswerController
);

// Api for placement officer to get all registered companies
router.get(
  "/api/allcompanies",
  authWithHeader,
  authGenerator("PO"),
  poRoutes.getRegisteredCompaniesController
);

// Api for placement officer to add companies to drive
router.get(
  "/api/companiesfordrive/:companyId",
  authWithHeader,
  authGenerator("PO"),
  poRoutes.addCompaniesToDriveController
);

// Api for placement officer to delete companies to drive
router.delete(
  "/api/companiesfordrive/:companyId",
  authWithHeader,
  authGenerator("PO"),
  poRoutes.deleteCompaniesToDriveController
);

// Convert junior to senior for PO
router.post(
  "/api/po/convert-to-senior",
  authWithHeader,
  authGenerator("PO"),
  poRoutes.convertSeniorToJuniorController
);

module.exports = router;
