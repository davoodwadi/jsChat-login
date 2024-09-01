// import {
//   getDB,
//   getUser,
//   addUser,
//   getAllMatchingUsers,
//   getLatestSession,
//   updateInfo,
//   addSaveContainer,
//   id2User,
// } from "./mongo.js";
import { User, MAX_TOKENS_PER_MONTH } from "./mongooseSchema.js";
import { refreshQuota } from "./dateManipulations.js";
import { addUser } from "./mongooseCode.js";
import express from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import path from "path";
import { fileURLToPath } from "url";

import {
  load,
  save,
  signup,
  login,
  authenticate,
  logout,
  profile,
  test,
} from "./loginRequests.js";
import {
  getHfCompletions,
  getStreamGPT,
  headStreamGpt,
  hfCompletions,
  hfCompletions70b,
  hfCompletions8b,
  streamGpt,
} from "./apiRequests.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const isHttps = true;
const port = process.env.PORT || 3000;

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
    collection: "chatSessions",
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

console.log("process.env.NODE_ENV");
console.log(process.env.NODE_ENV);

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

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
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";

passport.use(
  new LocalStrategy(async function (username, password, done) {
    // const user = users.filter((u) => u.username === username);
    const userDb = await getUser({ username: username });
    console.log("localStrategy userDb", userDb);
    if (!userDb) {
      return done(null, false);
    } else {
      console.log("validate: checking user ", userDb);
      if (userDb.username === username && userDb.password === password)
        console.log("validate success: returning user ", userDb);
      return done(null, userDb);
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
      callbackURL: "https://www.spreed.chat/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      // console.log("profile", profile);
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        givenName: profile.name.givenName,
        familyName: profile.name.familyName,
        username: profile.emails[0].value,
        email: profile.emails[0].value,
        emails: profile.emails,
        photos: profile.photos,
        photo: profile.photos[0].value,
      };
      try {
        const resAdd = await addUser(user);
        const userDb = await User.findOne({ username: user.username });
        console.log("entry found");
        userDb.lastLogin = new Date();
        await userDb.save();
        console.log(userDb.tokensRemaining);
        return cb(null, userDb);
      } catch (error) {
        console.log(error);
      }

      // try {
      //   //
      //   console.log("googleStrategy: adding user to db", user.username); // addUser already checks for existence
      //   const resAdd = await addUser(user);
      //   //
      //   console.log("looking for entry");
      //   const userDb = await getUser({ username: user.username });
      //   console.log("entry found");
      //   await updateInfo(userDb.username, { lastLogin: new Date() });
      //   return cb(null, userDb);
      // } catch (error) {
      //   console.log(error);
      // }
    }
  )
);
passport.serializeUser(function (user, cb) {
  cb(null, user.username);
});
// use id to recall the user
passport.deserializeUser(async function (username, cb) {
  // const user = users.filter((user) => user.username === username);
  console.log("*".repeat(10), "deserialize: ", username);
  const userDb = await User.findOne({ username: username });

  if (!userDb) {
    return cb(null, false); //new Error("User not found")
  }
  console.log("deserialize: returning user ", userDb.username);
  return cb(null, userDb);
});

app.use(passport.initialize());
app.use(passport.session());

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
    // console.log("session redirect:", req.session);
    res.redirect("/");
  }
);

// Route for the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/users/profile", async (req, res) => {
  // console.log(req.session);
  if (req.isAuthenticated()) {
    console.log("returning profile");

    // check for tokenRefresh
    const userDb = await User.findOne({ username: req.user.username });
    const refreshResult = await refreshQuota(userDb);
    console.log("refreshResult for quota:  ", refreshResult);
    //
    res.json({
      username: userDb.username,
      lastLogin: userDb.lastLogin,
      displayName: userDb.displayName,
      createdAt: userDb.createdAt,
      quotaRefreshedAt: userDb.quotaRefreshedAt,
      tokensConsumed: userDb.tokensConsumed,
      tokensRemaining: userDb.tokensRemaining,
      maxTokensPerMonth: userDb.maxTokensPerMonth,
    });
  } else {
    console.log("not logged in");
    // res.redirect("/login");
    res.status(404).send();
  }
});

app.get("/users/logout", function (req, res, next) {
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

app.post("/signup", (req, res, next) => {
  console.log("signup called");
  console.log(req.body);
});

// test session storage
app.get("/test-session", test);

app.get("/users/load", load);
app.post("/users/save", save);

// app.post("/users/signup", signup);
// app.post("/users/login", login);
// app.get("/users/logout", logout);

// app.get("/users/profile", authenticate, profile);

// LLM calls start
// Endpoint to handle API requests
// app.get("/", (req, res) => res.type('html').send(html));
// openai endpoint
app.post("/api/gpt/completions/stream", streamGpt);
// Adding a HEAD method for the touch
app.head("/api/gpt/completions/stream", headStreamGpt);
app.get("/api/gpt/completions/stream", getStreamGPT);

app.post("/api/hf/8b/completions", hfCompletions8b);
app.post("/api/hf/70b/completions", hfCompletions70b);
app.post("/api/hf/completions", hfCompletions);
app.get("/api/hf/completions", getHfCompletions);
// LLM calls end

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
