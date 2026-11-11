const { db } = require("../utils/db");
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
    console.log("Fetch error!", error);
  }
};

const getPatienId = async (dokterId) => {
  try {
    const snapshot = await db
      .collection("patientList")
      .where("dokterId", "==", dokterId)
      .get();

    if (snapshot.empty) {
      console.log("Id tidak ada");
    }

    const userList = snapshot.docs.map((doc) => doc.data().patientId);

    return userList;
  } catch (error) {
    console.log("Fetch error!", error);
  }
};

module.exports = { addPatient, getPatienId };
