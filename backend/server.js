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
import {
  addUser,
  findCheckoutSessionById,
  updateCheckoutSessionById,
} from "./mongooseCode.js";
import express from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";

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
import { configDotenv } from "dotenv";
const envLoaded = configDotenv("../.env");
console.log(`envLoaded: ${envLoaded.parsed}`);

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const isHttps = true;
const port = process.env.PORT || 3000;

const app = express();
// mongodb session
const store = new MongoDBStore(session);
const mongoPassword = process.env.mongoPassword;
// console.log('mongoPassword: ', mongoPassword)
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

// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import passport from "passport";
import LocalStrategy from "passport-local";
import GoogleStrategy from "passport-google-oauth20";

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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ADDRESS}/auth/google/callback`,
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
  res.sendFile(path.join(__dirname, "../frontend/home.html"));
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

// stripe
import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_KEY_TEST);
const stripe = new Stripe(process.env.STRIPE_SECRET);
import { product, price } from "./create_price.js";
// console.log(price)
// use req.user.username as the session description
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.SERVER_ADDRESS}/?session_id={CHECKOUT_SESSION_ID}`, // Pass session_id in URL
      cancel_url: `${process.env.SERVER_ADDRESS}/?session_id=0`,
    });
    const userDb = await User.findOne({ username: req.user.username });
    userDb.checkoutSessions.push(session);
    await userDb.save();
    // console.log('CHECKOUT session: ', session)
    console.log("session.url: ", session.url);
    console.log("CHECKOUT: req.user.username: ", req.user.username);
    console.log(
      "CHECKOUT: session.metadata.username: ",
      session.metadata.username
    );
    console.log(`CHECKOUT: session.id: ${session.id}`);
    res.redirect(303, session.url);
  } catch (error) {
    console.log(`ERROR with Stripe API: ${error}`);
    res.status(500);
  }
});

const endpointSecret = process.env.WEBHOOK_SECRET;
// const endpointSecret = 'sdfsdf'
app.post(
  "/stripe_webhooks",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    console.log("*".repeat(10));

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const checkoutSession = event.data.object;
        console.log(
          "checkoutSession.payment_status: ",
          checkoutSession.payment_status
        );
        const userDb = await updateCheckoutSessionById(
          checkoutSession.id,
          checkoutSession
        );
        console.log("WEBHOOK userDb: ", userDb);
        if (checkoutSession.payment_status === "paid" && userDb) {
          try {
            // Top up the user's account
            userDb.tokensRemaining += userDb.maxTokensPerMonth;
            await userDb.save();
            console.log(
              `Account successfully topped up ${userDb.maxTokensPerMonth} tokens for user:`,
              userDb.username,
              checkoutSession.id
            );
          } catch (error) {
            console.log(
              `ERROR: updating quota after payment for user ${userDb.username}, session ID: ${checkoutSession.id}, ${error}`
            );
          }
        } else {
          console.log(
            `ERROR: payment details missing: session ID: ${checkoutSession.id}`
          );
        }

        console.log("*".repeat(10));

        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

// app.post('/stripe_webhooks', express.raw({type: 'application/json'}), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   console.log('*'.repeat(10))
//   console.log(sig)
//   console.log('*'.repeat(10))

//   const event = req.body;

//   try {
//     switch (event.type) {
//       case 'checkout.session.completed': {
//         const session = event.data.object; // Stripe session object
//         console.log('WEBHOOK: session.metadata.username: ', session.metadata.username)
//         // Get user information from stored session details
//         // const storedSession = await db.getSessionBySessionId(session.id);

//         if (session.payment_status === 'paid' && session.metadata.username) {
//           try {
//             // Top up the user's account
//             const userDb = await User.findOne({username:session.metadata.username})
//             userDb.tokensRemaining += userDb.maxTokensPerMonth
//             await userDb.save()
//             console.log(`Account successfully topped up ${userDb.maxTokensPerMonth} tokens for user:`, session.metadata.username, session.id, '\n AKA \n', userDb.username);
//           } catch(error){

//           }
//         }

//         break;
//       }
//       default:
//         // console.log(`Unhandled event type ${event.type}`);
//     }

//     res.json({ received: true });
//   } catch (error) {
//     console.error('Webhook handler error:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// END stripe

app.post("/signup", (req, res, next) => {
  console.log("signup called");
  console.log(req.body);
});

// test session storage
app.get("/test-session", test);

app.get("/users/load", express.json(), load);
app.post("/users/save", express.json(), save);

// app.post("/users/signup", signup);
// app.post("/users/login", login);
// app.get("/users/logout", logout);

// app.get("/users/profile", authenticate, profile);

// LLM calls start
// Endpoint to handle API requests
// app.get("/", (req, res) => res.type('html').send(html));
// openai endpoint
app.post("/api/gpt/completions/stream", express.json(), streamGpt);
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
