// Dependencies
const express = require("express");
const ejs = require("ejs");

// Services
// user
const { addUser } = require("./services/userService");

// EJS Setup
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Port
const port = 3000;

// // Try DB
// const main = async () => {
//   // Try add user
//   try {
//     const user = await addUser({
//       username: "Farhan",
//       fullname: "FarhanAlr",
//       dob: "02-02-1945",
//       password: "123",
//     });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

// main();

// Routing

// userDashboard
app.get("/", (req, res) => {
  res.render("userDashboard");
});

// Port listened
try {
  app.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
  });
} catch (error) {
  console.log(`Failed to listened to port ${port}`, error.message);
}
