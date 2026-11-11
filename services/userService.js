const { db } = require("../utils/db");
const { userValidation } = require("../models/Users");
const { text } = require("express");

// Capitalize
const capitalize = (text) => {
  if (text == null || text === "") return "";

  text = String(text);
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

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
      gender: userData.gender,
      bloodType: userData.bloodType,
      phone: userData.phone,
      password: userData.password,
      role: userData.role,
    });

    console.log("User Ditambah ✅");
  } catch (error) {
    console.log("Gagal menambah user baru ❌", error);
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
    console.log("Fetch Error!!", error);
  }
};

// GET USER LIST

// Pasien
const getPasienList = async () => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "pasien")
      .get();

    const getPasienData = snapshot.docs.map((doc) => ({
      userId: doc.id,
      fullname: doc.data().fullname,
      username: doc.data().username,
      role: capitalize(doc.data().role),
    }));

    const pasienCount = snapshot.size;

    return {
      getPasienData,
      pasienCount,
    };
  } catch (error) {
    console.log("Fetch Error!!", error);
  }
};

// Search Pasien
const searchPasien = async (keyword) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "pasien")
      .get();
    const getPasienData = snapshot.docs
      .map((doc) => ({
        userId: doc.id,
        fullname: doc.data().fullname,
        username: doc.data().username,
        role: capitalize(doc.data().role),
      }))
      .filter(
        (doc) =>
          doc.fullname?.toLowerCase().includes(keyword.toLowerCase()) ||
          doc.username?.toLowerCase().includes(keyword.toLowerCase())
      );

    return { getPasienData };
  } catch (error) {
    console.log("Fetch Error!!", error);
    throw error;
  }
};

// Dokter
const getDokterList = async () => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "dokter")
      .get();

    const getDokterData = snapshot.docs.map((doc) => ({
      userId: doc.id,
      fullname: doc.data().fullname,
      username: doc.data().username,
      role: capitalize(doc.data().role),
    }));

    const dokterCount = snapshot.size;

    return {
      getDokterData,
      dokterCount,
    };
  } catch (error) {
    console.log("Fetch Error!!", error);
  }
};

// Search Dokter
const searchDokter = async (keyword) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "dokter")
      .get();
    const getDokterData = snapshot.docs
      .map((doc) => ({
        userId: doc.id,
        fullname: doc.data().fullname,
        username: doc.data().username,
        role: capitalize(doc.data().role),
      }))
      .filter(
        (doc) =>
          doc.fullname?.toLowerCase().includes(keyword.toLowerCase()) ||
          doc.username?.toLowerCase().includes(keyword.toLowerCase())
      );

    return { getDokterData };
  } catch (error) {
    console.log("Fetch Error!!", error.message);
    throw error;
  }
};

// Admin
const getAdminList = async () => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "admin")
      .get();

    const getAdminData = snapshot.docs.map((doc) => ({
      userId: doc.id,
      fullname: doc.data().fullname,
      username: doc.data().username,
      role: capitalize(doc.data().role),
    }));

    const adminCount = snapshot.size;

    return {
      getAdminData,
      adminCount,
    };
  } catch (error) {
    console.log("Fetch Error!!", error);
  }
};

// Search Admin
const searchAdmin = async (keyword) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "admin")
      .get();
    const getAdminData = snapshot.docs
      .map((doc) => ({
        userId: doc.id,
        fullname: doc.data().fullname,
        username: doc.data().username,
        role: capitalize(doc.data().role),
      }))
      .filter(
        (doc) =>
          doc.fullname?.toLowerCase().includes(keyword.toLowerCase()) ||
          doc.username?.toLowerCase().includes(keyword.toLowerCase())
      );

    return { getAdminData };
  } catch (error) {
    console.log("Fetch Error!!", error);
    throw error;
  }
};

const delUser = async (id) => {
  try {
    const delData = await db.collection("users").doc(id).delete();
    console.log("User berhasil dihapus.");
    return delData;
  } catch (error) {
    console.log("Fetch Error!!", error);
  }
};

const updateUser = async (id, userData) => {
  try {
    const updateData = {
      username: userData.username,
      fullname: userData.fullname,
      dob: userData.dob,
      gender: userData.gender,
      bloodType: userData.bloodType,
      phone: userData.phone,
      role: userData.role,
    };

    if (userData.password !== undefined) {
      updateData.password = userData.password;
    }

    await db.collection("users").doc(id).update(updateData);

    return true;
  } catch (error) {
    console.log("Fetch Error!!", error);
    throw error;
  }
};

const getPasienListbyId = async (ids = []) => {
  try {
    const snapshot = await Promise.all(
      ids.map((id) => db.collection("users").doc(id).get())
    );

    const getPasien = snapshot
      .filter((doc) => doc.exists)
      .map((doc) => {
        const data = doc.data();

        return {
          userId: doc.id,
          username: data.username,
          fullname: data.fullname,
          dob: data.dob,
          gender: data.gender,
          bloodType: data.bloodType,
          phone: data.phone,
          role: capitalize(data.role),
        };
      });

    return getPasien;
  } catch (error) {
    console.log("Fetch error!", error);
  }
};

module.exports = {
  addUser,
  validateUser,
  getUserData,
  getPasienList,
  getDokterList,
  getAdminList,
  searchPasien,
  searchDokter,
  searchAdmin,
  updateUser,
  delUser,
  getPasienListbyId,
};
