import {
  getDB,
  getUser,
  addUser,
  getAllMatchingUsers,
  getLatestSession,
  updateInfo,
  addSaveContainer,
  id2User,
} from "./mongo.js";

import express from "express";
import session from "express-session";

import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__filename);
console.log(__dirname);

import MongoDBStore from "connect-mongodb-session";

const PORT = process.env.PORT || 3000;

const app = express();
// mongodb session
const store = new MongoDBStore(session);
const mongoPassword = process.env.mongoPassword;
const uri =
  "mongodb+srv://davoodwadi:<password>@cluster0.xv9un.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0".replace(
    "<password>",
    mongoPassword
  );

const mongodbStore = new store(
  {
    uri: uri,
    databaseName: "chat",
    collection: "chatSessions-test",
  },
  function (error) {
    // Should have gotten an error
    console.log("*****session DB error:", error);
  }
);

// Catch errors
mongodbStore.on("error", (error) => {
  console.log("*****theres an error in the session DB*******");
  console.error(error);
});
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    store: mongodbStore,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import passport from "passport";
import LocalStrategy from "passport-local";
import { users } from "./users.js";

passport.use(
  new LocalStrategy(function (username, password, done) {
    const user = users.filter((u) => u.username === username);
    console.log(user);
    if (user.length === 0) {
      return done(null, false);
    } else if (user.length > 1) {
      return done(null, false);
    } else {
      console.log("validate: returning user ", user[0]);
      return done(null, user[0]);
    }
  })
);
passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});
// use id to recall the user
passport.deserializeUser(function (id, cb) {
  const user = users.filter((user) => user.id === id);
  if (user.length === 0) {
    return cb(new Error("User not found"));
  } else if (user.length > 1) {
    return cb(new Error("Multiple users with the same ID found"));
  } else {
    console.log("deserialize: returning user ", user[0]);
    cb(null, user[0]);
  }
});

app.use(passport.initialize());
app.use(passport.session());

function checkAuthenticated(req, res, next) {
  console.log("req.user middle ware", req.user);
  if (req.user) {
    console.log("authenticated. redirecting to profile");
    res.redirect("/profile");
  } else {
    console.log("NOT authenticated. redirecting to login");
    res.redirect("/login");
  }
}

// Route to serve the login page
app.get("/", checkAuthenticated, (req, res) => {
  console.log(req.session);
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/login", (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/profile");
  }
  // res.redirect("loginPage");
  res.sendFile(path.join(__dirname, "../frontend/loginPage.html"));
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    console.log("user authenticate : ", user);
    if (err) {
      console.error("Error during authentication:", err);
      return next(err);
    }
    if (!user) {
      console.log("Authentication failed, no user found.");
      return res.redirect("/");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Error during login:", err);
        return next(err);
      }
      console.log("Authentication process complete");
      return res.redirect("/profile");
    });
  })(req, res, next);
});

app.get("/profileInfo", (req, res) => {
  console.log("profile: ", req.user);
  res.json({
    username: req.user.username,
  });
});

app.get("/profile", (req, res) => {
  console.log(req.session);
  if (req.isAuthenticated()) {
    console.log("going to profile");
    res.sendFile(path.join(__dirname, "../frontend/profile.html"));
  } else {
    console.log("going to login");
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
