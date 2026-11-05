// Dependencies
const express = require("express");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const methodOverride = require("method-override");
const { FirestoreSessionStore } = require("./utils/firestoreSession");

// Services

// user
const {
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
} = require("./services/userService");

// patient
const { addPatient } = require("./services/patientList");

//Esp Data
const { addEspRecord, readEspRecord } = require("./services/espService");

// Db
const { db } = require("./utils/db");

// EJS Setup
const app = express();
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Port
const port = 3000;

// Sessions
app.use(cookieParser("secret"));
app.use(
  session({
    store: new FirestoreSessionStore({
      db,
      collection: "sessions",
      ttlms: 60 * 60 * 1000,
    }),
    name: "sid",
    secret: process.env.SESSION_SECRET,
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

const isAuth = (req, res, next) => {
  if (req.session.isAuth && req.session.userId && req.session.role) {
    return next();
  } else {
    return res.redirect("/login");
  }
};

const authRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.session.role)) {
      return res.status(403).send("Akses ditolak");
    }

    next();
  };
};

// Routing

// Homepage
app.get("/", async (req, res) => {
  if (!req.session.isAuth) {
    return res.redirect("/login");
  }

  switch (req.session.role) {
    case "admin":
      return res.redirect("/adminDashboard");
    case "dokter":
      return res.redirect("/dokterDashboard");
    case "pasien":
      return res.redirect("/pasienDashboard");
    default:
      return res.redirect("/login");
  }
});

// GENERAL ENVIRONMENT

// Login Page
app.get("/login", (req, res) => {
  res.render("Login");
});
// login process
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate User
    const getUserData = await validateUser(username);
    if (!getUserData) {
      console.log("Username atau Password salah");
      return res.redirect("/login");
    }

    const cekPass = await bcrypt.compare(password, getUserData.password);
    if (!cekPass) {
      console.log("Username atau Password salah");
      return res.redirect("/login");
    }

    // Session Regen
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.isAuth = true;
      req.session.userId = getUserData.id;
      req.session.role = getUserData.role;

      req.session.save((err) => {
        if (err) return next(err);

        // Validate role
        switch (req.session.role) {
          case "admin":
            return res.redirect("/adminDashboard");
          case "dokter":
            return res.redirect("/dokterDashboard");
          case "pasien":
            return res.redirect("/pasienDashboard");
          default:
            return res.redirect("/login");
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// Logout process
app.post("/logout", async (req, res) => {
  try {
    req.session.destroy();
    return res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
});

// ADMIN ENVIRONMENT
// adminDashboard Utama
app.get("/adminDashboard", isAuth, authRole("admin"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);
  const { pasienCount } = await getPasienList();
  const { adminCount } = await getAdminList();
  const { dokterCount } = await getDokterList();
  res.render("admin/adminDashboard", {
    title: "Dashboard Admin",
    userData,
    pasienCount,
    adminCount,
    dokterCount,
    activeTab: "dashboard",
  });
});

// Halaman Profil Admin
app.get(
  "/adminDashboard/profile",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    const userId = req.session.userId;
    const userData = await getUserData(userId);
    res.render("admin/profilAdmin", {
      title: "Profil Admin",
      userData,
      activeTab: "profile",
    });
  }
);

// Halaman Detail Pengguna (Admin)
app.get(
  "/adminDashboard/user/:id",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const userData = await getUserData(userId);
      const targetUserId = req.params.id;
      const targetUser = await getUserData(targetUserId);

      res.render("admin/detailUser", {
        title: "Detail Pengguna - Admin Dashboard",
        userData,
        targetUser,
        activeTab: "dashboard",
      });
    } catch (error) {
      console.log("Gagal memuat detail user:", error.message);
      return res.redirect("/adminDashboard");
    }
  }
);

// Update User Data
app.put("/adminDashboard/user", isAuth, authRole("admin"), async (req, res) => {
  try {
    const {
      userId,
      oldUname,
      username,
      fullname,
      dob,
      gender,
      bloodType,
      oldPhone,
      phone,
      password,
      role,
    } = req.body;

    if (!userId) {
      return res.status(400).send("User tidak ada");
    }

    // Username existing check
    if (username !== oldUname) {
      const checkUname = await db
        .collection("users")
        .where("username", "==", username)
        .limit(1)
        .get();
      if (!checkUname.empty) {
        return res.redirect(`/adminDashboard/user/${userId}`);
      }
    }

    // Phone existing check
    if (phone !== oldPhone) {
      const checkPhone = await db
        .collection("users")
        .where("phone", "==", phone)
        .limit(1)
        .get();
      if (!checkPhone.empty) {
        return res.redirect(`/adminDashboard/user/${userId}`);
      }
    }

    if (username !== oldUname) {
      const checkUname = await db
        .collection("users")
        .where("username", "==", username)
        .limit(1)
        .get();
      if (!checkUname.empty) {
        console.log("Username sudah digunakan!!");
        return res.redirect(`/adminDashboard/user/${userId}`);
      }
    }

    const userData = {
      username,
      fullname,
      dob,
      gender,
      bloodType,
      phone: phone?.trim() || "",
      role,
    };

    if (password && password.trim() !== "") {
      userData.password = await bcrypt.hash(password, 12);
    }
    await updateUser(userId, userData);

    return res.redirect(`/adminDashboard/user/${userId}`);
  } catch (error) {
    console.log("Update User Error:", error);
    res.status(500).send("Gagal memperbarui data pengguna");
  }
});

// Halaman tambah pasien ke dokter
app.get(
  "/adminDashboard/dokter/add-pasien/:id",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const userData = await getUserData(userId);
      const targetDokterId = req.params.id;
      const targetDokter = await getUserData(targetDokterId);
      const { getPasienData } = await getPasienList();

      res.render("admin/addPasienDokter", {
        title: "Tambah Pasien ke Dokter",
        userData,
        targetDokter,
        getPasienData,
        activeTab: "dokter",
      });
    } catch (error) {
      console.log("Gagal memuat halaman add pasien dokter:", error.message);
      return res.redirect("/adminDashboard/dokter");
    }
  }
);
// Proses tambah pasien ke dokter
app.post(
  "/adminDashboard/dokter/add-pasien",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    try {
      const { dokterId, pasienId } = req.body;
      const data = {
        dokterId,
        pasienId,
      };
      await addPatient(data);
      return res.redirect("/adminDashboard/dokter/");
    } catch (error) {
      console.log("Gagal menambah pasien", error);
    }
  }
);

// ==========================================

// Daftar Pasien
app.get(
  "/adminDashboard/pasien",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    const userId = req.session.userId;
    const userData = await getUserData(userId);
    const search = req.query.search || "";
    const result = search ? await searchPasien(search) : await getPasienList();
    const { getPasienData } = result;
    res.render("admin/daftarPasien", {
      title: "Daftar Pasien",
      search,
      userData,
      getPasienData,
      activeTab: "pasien",
    });
  }
);

// Daftar Dokter
app.get(
  "/adminDashboard/dokter",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    const userId = req.session.userId;
    const userData = await getUserData(userId);
    const search = req.query.search || "";
    const result = search ? await searchDokter(search) : await getDokterList();
    const { getDokterData } = result;
    res.render("admin/daftarDokter", {
      title: "Daftar Dokter",
      userData,
      search,
      getDokterData,
      activeTab: "dokter",
    });
  }
);

// Daftar Admin
app.get(
  "/adminDashboard/admin",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    const userId = req.session.userId;
    const userData = await getUserData(userId);
    const search = req.query.search || "";
    const result = search ? await searchAdmin(search) : await getAdminList();
    const { getAdminData } = result;
    res.render("admin/daftarAdmin", {
      title: "Daftar Admin",
      userData,
      search,
      getAdminData,
      activeTab: "admin",
    });
  }
);

// Add User
app.get(
  "/adminDashboard/addUser",
  isAuth,
  authRole("admin"),
  async (req, res) => {
    const userId = req.session.userId;
    const userData = await getUserData(userId);
    res.render("admin/addUser", {
      title: "Add User",
      userData,
      activeTab: "addUser",
    });
  }
);

// proccess addUser
app.post("/adminDashboard/addUser", async (req, res) => {
  try {
    const {
      username,
      fullname,
      dob,
      gender,
      bloodType,
      phone,
      password,
      password2,
      role,
    } = req.body;

    const checkUname = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    const CheckPhone = await db
      .collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (!checkUname.empty || !CheckPhone.empty) {
      console.log("Username atau no telepon sudah ada!!");
      return res.redirect("/addUser");
    }

    if (password2 !== password) {
      console.log("Password tidak sama!!");
      return res.redirect("/addUser");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await addUser({
      username: username,
      fullname: fullname,
      dob: dob,
      gender: gender,
      bloodType: bloodType,
      phone: phone,
      password: hashedPassword,
      role: role,
    });

    return res.redirect("/adminDashboard");
  } catch (error) {
    console.log("Gagal menambah user:", error.message);
    res.status(500).send("Error Fetching " + error.message);
  }
});

// Delete User
app.delete("/user", isAuth, authRole("admin"), async (req, res) => {
  try {
    const userId = req.body.user_id;
    await delUser(userId);
    const redirUrl = req.query.redirect || "/";
    return res.redirect(redirUrl);
  } catch (error) {
    console.log("Gagal menghapus user!!");
  }
});

// DOKTER ENVIRONMENT
app.get("/dokterDashboard", isAuth, authRole("dokter"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);
  res.render("dokter/dokterDashboard", { title: "Dashboard Dokter", userData });
});

// PASIEN ENVIRONMENT
app.get("/pasienDashboard", isAuth, authRole("pasien"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);

  res.render("pasien/userDashboard", {
    title: "Dashboard Pasien",
    userData,
    patienId: userId,
  });
});

app.get("/user/profile", isAuth, authRole("pasien"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);
  res.render("pasien/profilPasien", {
    title: "Profil Pasien",
    userData,
  });
});

app.post(
  "/pasienDashboard/api/esp-data",
  isAuth,
  authRole("pasien"),
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const { deviceId, value } = req.body;
      console.log(typeof userId);

      const record = await addEspRecord(deviceId, userId, value);

      res.status(201).json({
        message: "ESP data saved successfully",
        data: record,
      });

      console.log("Sensor value saved.");
    } catch (error) {
      console.log("Gagal mengirim data esp!!", error);
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

// Port listened
try {
  app.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
  });
} catch (error) {
  console.log(`Failed to listened to port ${port}`, error.message);
}
