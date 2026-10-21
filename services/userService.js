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
      username: userData.username,
      fullname: userData.fullname,
      dob: userData.dob,
      password: userData.password,
      role: userData.role,
    });

    console.log("User Ditambah ✅");
  } catch (error) {
    console.log("Gagal menambah user baru ❌", error.message);
  }
};

// Validete User
const validateUser = async (username) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }
    const userDocs = snapshot.docs[0];
    // const userData = userDocs.data();

    return {
      id: userDocs.id,
      ...userDocs.data(),
    };
  } catch (error) {
    console.log("Fettch error!", error);
  }
};

// Get User Data
const getUserData = async (id) => {
  try {
    const userRef = await db.collection("users").doc(id).get();
    if (!userRef.exists) {
      throw new Error("Data user tidak ditemukan!!");
    }

    return {
      id: userRef.id,
      ...userRef.data(),
    };
  } catch (error) {
    console.log("Fetch Error!!", error.message);
  }
};

module.exports = { addUser, validateUser, getUserData };
