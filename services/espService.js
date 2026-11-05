const { db } = require("../utils/db");
const { createEspRecord } = require("../models/Esp");

// Tambah record esp
const addEspRecord = async (deviceId, patientId, value) => {
  try {
    // Validasi nilai esp
    const espRecord = createEspRecord({ deviceId, patientId, value });

    // Kirim ke Firebase
    await db.collection("EspData").add(espRecord);
    return espRecord;
  } catch (error) {
    console.log("Error Fetch!!", error);
  }
};

// Baca record esp
const readEspRecord = async (patientId, callback) => {
  try {
    const espValue = await db
      .collection("EspData")
      .where("patientId", "==", patientId)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "string" || change.type === "modified") {
            callback(change.doc.data().value);
          }
        });
      });

    return espValue;
  } catch (error) {
    console.log("Fetch error", error);
  }
};

module.exports = { addEspRecord, readEspRecord };
