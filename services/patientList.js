const { db } = require("../utils/db");
const { userValidation } = require("../models/Users");
const { text } = require("express");

const addPatient = async (data) => {
  try {
    const patientRef = db.collection("patientList").doc();
    await patientRef.set({
      dokterId: data.dokterId,
      patientId: data.pasienId,
    });

    console.log("Pasien berhasil ditambah ✅");
  } catch (error) {
    console.log("Fetch error", error);
  }
};

module.exports = { addPatient };
