const createEspRecord = ({ deviceId, patientId, value }) => {
  if (!deviceId || typeof deviceId !== "string") {
    throw new Error("Invalid Device Id!!");
  }

  if (!patientId || typeof patientId !== "string") {
    throw new Error("Invalid Patient Id!!");
  }

  if (!Number.isFinite(value)) {
    throw new Error("Invalid Sensor Value!!");
  }

  return {
    deviceId,
    patientId,
    value,
    recordedAt: new Date(),
  };
};

module.exports = { createEspRecord };
