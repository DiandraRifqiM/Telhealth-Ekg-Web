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
  delUser,
} = require("./services/userService");
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
        // console.log("Session tersimpan");
        // console.log("Role session:", req.session.role);

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
    res.redirect("/login");
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
    console.log("Search:", search);
    console.log("Result:", result);
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
app.get("/addUser", isAuth, authRole("admin"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);
  res.render("admin/addUser", {
    title: "Add User",
    userData,
    activeTab: "addUser",
  });
});

// proccess addUser
app.post("/addUser", async (req, res) => {
  try {
    const { username, fullname, dob, password, password2, role } = req.body;

    // Check username
    const checkUname = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (!checkUname.empty) {
      console.log("Username usdah ada!!");
      return res.redirect("/addUser");
    }

    // Matching password
    if (password2 !== password) {
      console.log("Password tidak sama!!");
      return res.redirect("/addUser");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userAdd = await addUser({
      username: username,
      fullname: fullname,
      dob: dob,
      password: hashedPassword,
      role: role,
    });

    res.redirect("/adminDashboard");
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
    res.redirect(redirUrl);
  } catch (error) {
    console.log("Gagal menghapus user!!");
  }
});

// DOKTER ENVIRONMENT
// dokterDashboard
app.get("/dokterDashboard", isAuth, authRole("dokter"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);
  res.render("dokter/dokterDashboard", { title: "Dashboard Dokter", userData });
});

// PASIEN ENVIRONMENT
// pasienDashboard
app.get("/pasienDashboard", isAuth, authRole("pasien"), async (req, res) => {
  const userId = req.session.userId;
  const userData = await getUserData(userId);
  res.render("pasien/userDashboard", { title: "Dashboard Pasien", userData });
});

// Port listened
try {
  app.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
  });
} catch (error) {
  console.log(`Failed to listened to port ${port}`, error.message);
}
