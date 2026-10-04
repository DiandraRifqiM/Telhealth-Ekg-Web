const { db } = require("../utils/db");
const { userValidation } = require("../models/Users");

// Create user
const addUser = async (userData) => {
  try {
    // Validate user data
    userValidation(userData);

    // Adduser
    const userRef = db.collection("users").doc();
    await userRef.set({
      name: userData.username,
      fullname: userData.fullname,
      dob: userData.dob,
      password: userData.password,
    });

    console.log("User added ✅");
    return {
      id: userRef.id,
      ...userData,
    };
  } catch (error) {
    console.log("Gagal menambah user baru ❌", error.message);
  }
};

module.exports = { addUser };
