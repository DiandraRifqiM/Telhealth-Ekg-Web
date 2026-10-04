const userSchema = {
  username: {
    type: "string",
    required: true,
  },
  fullname: {
    type: "string",
    required: true,
  },
  dob: {
    type: "string",
    required: true,
  },
  password: {
    type: "string",
    required: true,
  },
};

const userValidation = (data) => {
  for (const field in data) {
    const rules = userSchema[field];
    const value = data[field];

    // Blank value handling
    if (rules.required && value === undefined) {
      throw new Error(`${field} are required!!`);
    }

    // Data type handling
    if (value !== undefined && typeof value !== rules.type) {
      throw new Error(`${field} must be ${rules.type}, got ${typeof field}`);
    }
  }
  return true;
};

module.exports = { userSchema, userValidation };
