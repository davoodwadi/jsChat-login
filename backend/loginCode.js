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

const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import passport from "passport";
import LocalStrategy from "passport-local";
import GoogleStrategy from "passport-google-oauth20";
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
// console.log(process.env.GOOGLE_CLIENT_ID);
function addObjectIfNotExists(array, object) {
  if (!array.some((item) => JSON.stringify(item) === JSON.stringify(object))) {
    array.push(object);
  }
}
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log("profile", profile);
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        name: profile.displayName,
        username: profile.emails[0].value,
        emails: profile.emails,
        photos: profile.photos,
      };
      addObjectIfNotExists(users, user);
      console.log("google strategy", users);

      return cb(null, user);
    }
  )
);

console.log("clientidtest", process.env["FACEBOOK_CLIENT_ID_TEST"]);
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env["FACEBOOK_CLIENT_ID_TEST"],
      clientSecret: process.env["FACEBOOK_CLIENT_SECRET_TEST"],
      callbackURL:
        "https://todos-express-facebook.onrender.com/oauth2/redirect/facebook",
      state: true,
    },
    function verify(accessToken, refreshToken, profile, cb) {
      console.log("profile", profile);
      var user = {
        id: 1,
        name: profile.displayName,
      };
      return cb(null, user);
    }
  )
);
passport.serializeUser(function (user, cb) {
  cb(null, user.username);
});
// use id to recall the user
passport.deserializeUser(function (username, cb) {
  const user = users.filter((user) => user.username === username);
  if (user.length === 0) {
    return cb(null, false); //new Error("User not found")
  } else if (user.length > 1) {
    return cb(null, false); //new Error("Multiple users with the same ID found")
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
  // res.sendFile(path.join(__dirname, "../frontend/index.html"));
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, redirect home.
    console.log("logged in succesfully");
    console.log("session redirect:", req.session);
    res.redirect("/profileInfo");
  }
);

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    console.log("user authenticate : ", user);
    if (err) {
      console.error("Error during authentication:", err);
      return next(err);
    }
    if (!user) {
      console.log("Authentication failed, no user found.");
      // return res.redirect("/login");
      return res.status(404).send("User not found.");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Error during login:", err);
        return next(err);
      }
      console.log("Authentication process complete");
      // return res.redirect("/profile");
      return res.status(200).send({ username: req.user.username });
    });
  })(req, res, next);
});

app.post("/signup", (req, res, next) => {
  const exists = users.some((user) => user.username === req.body.username);
  if (exists) {
    res.status(200).send("the username already exists.");
  } else {
    const maxID = Math.max(...users.map((user) => user.id));
    users.push({
      username: req.body.username,
      password: req.body.password,
      id: maxID + 1,
    });
    console.log(users);
    res.status(200).send("Signup successful.");
  }
});

app.get("/profileInfo", (req, res) => {
  console.log("req.session: ", req.session);
  console.log("req.user: ", req.user);
  if (req.user) {
    res.send(
      `<h1>Welcome ${req.user.username}</h1> <a href="/logout">logout</a>`
    );
  } else {
    res.send(`<h1>Welcome</h1> <a href="/logout">logout</a>`);
  }

  // res.json({
  //   username: req.user.username,
  // });
});

app.get("/profile", (req, res) => {
  console.log(req.session);
  if (req.isAuthenticated()) {
    console.log("returning profile");
    // res.sendFile(path.join(frontendPath, "profile.html"));
    // res.json({ username: req.user.username });
  } else {
    console.log("not logged in");
    // res.redirect("/login");
    res.status(404).send();
  }
});

app.get("/logout", function (req, res, next) {
  console.log("logging out: ", req.user);
  req.logout(function (err) {
    if (err) {
      // res.status(500);
      return next(err);
    }
    // res.redirect("/");
    res.status(200).send("server: logged out");
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
