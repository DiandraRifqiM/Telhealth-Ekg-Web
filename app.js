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

// Login
app.get("/", (req, res) => {
  res.render("Login");
});

app.get("/login", (req, res) => {
  res.render("Login");
});

// addUser

// userDashboard
app.get("/userDashboard", (req, res) => {
  res.render("userDashboard");
});

// adminDashboard
app.get("/adminDashboard", (req, res) => {
  res.render("adminDashboard");
});

// doctorDashboard
app.get("/doctorDashboard", (req, res) => {
  res.render("docterDashboard");
});

// addUser
app.get("/addUser", (req, res) => {
  res.render("addUser");
});

// proccess addUser
app.post("/addUser", async (req, res) => {
  try {
    const { username, fullname, dob, password } = req.body;

    await addUser({
      username,
      fullname,
      dob,
      password,
    });

    console.log("User baru berhasil ditambahkan!");
    res.redirect("/adminDashboard"); // Setelah sukses, kembalikan ke admin dashboard
  } catch (error) {
    console.log("Gagal menambah user:", error.message);
    res
      .status(500)
      .send("Terjadi kesalahan saat menambah user: " + error.message);
  }
});

// Port listened
try {
  app.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
  });
} catch (error) {
  console.log(`Failed to listened to port ${port}`, error.message);
}
