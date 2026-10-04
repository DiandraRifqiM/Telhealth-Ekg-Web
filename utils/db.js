const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Service Account
const serviceAccount = require("../FirebaseKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const dbConn = async () => {
  try {
    await db.collection("users").limit(1).get();
    console.log("Firebase connected ✅");
  } catch (error) {
    console.log("Failed connected to firebase ❌", error.message);
  }
};

dbConn();

module.exports = { db };
