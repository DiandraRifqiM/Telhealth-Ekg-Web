// Dependencies
const express = require("express");

// Services
// user
const { addUser } = require("./services/userService");

// EJS Setup
const app = express();
app.set(express.static("public"));

// Port
const port = 3000;

// Try DB
const main = async () => {
  // Try add user
  try {
    const user = await addUser({
      username: "firstUser",
      fullname: "ThisIsFirstUser",
      dob: "01-01-2000",
      password: "firstUser",
    });
  } catch (error) {
    console.log(error.message);
  }
};

main();

// Port listened
try {
  app.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
  });
} catch (error) {
  console.log(`Failed to listened to port ${port}`, error.message);
}
