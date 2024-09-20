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
import { User } from "./mongooseSchema.js";

export async function load(req, res) {
  console.log("calling from outside");
  try {
    console.log("*******Load latest*****************");
    if (!req.user) {
      res.status(404).json({ message: "Not logged in. Please login." });
    } else {
      const userDb = await User.findOne({ username: req.user.username });
      if (!userDb) {
        res.status(404).json({ message: "User not found. Please login." });
      } else {
        // const latest = await getLatestSession(user.username);
        const latest = userDb.sessions.at(-1);
        console.log("loading latest session");
        console.log(latest);
        if (latest) {
          //{time: , saveContainer:}
          res.status(200).json(latest);
        } else {
          res.status(400).json({ time: null, saveContainer: null });
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

export async function save(req, res) {
  try {
    console.log("Saving saveContainer*****************");
    const saveContainer = req.body.saveContainer;
    console.log("saveContainer: ", saveContainer);
    // const user = await getUser(askedUserName);
    if (!req.user.username) {
      res.json("Not logged in. Please login.");
    } else {
      const userDb = await User.findOne({ username: req.user.username });
      if (!userDb) {
        res.json("User not found. Please login.");
      } else {
        // await addSaveContainer(user.username, saveContainer);

        userDb.sessions.push({
          time: new Date(),
          saveContainer: saveContainer,
        });
        // save it
        await userDb.save();
        // console.log("userDb.sessions: ", userDb.sessions);
        console.log("adding saveContainer for " + userDb.username);
        const updatedUserDb = await User.findOne({ username: userDb.username });
        console.log(
          "updatedUserDb: final session\n",
          updatedUserDb.sessions[updatedUserDb.sessions.length - 1]
        );
        console.log("length before:", userDb.sessions.length);
        console.log("length after:", updatedUserDb.sessions.length);
        console.log("******END: Saving saveContainer*****************");
        res.json("success");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

export async function signup(req, res) {
  try {
    const newUserName = req.body.username;
    const newPassword = req.body.password;

    // check if username exists
    const userExists = await getUser(newUserName);
    if (userExists) {
      res.json("the username already exists.");
    } else {
      // add user to db
      await addUser(newUserName, newPassword);
      const newUserEntry = await getUser(newUserName);
      req.session.userId = newUserEntry._id; // Store user ID in the session

      // req.session.cookie.userId = user._id;  // Store user ID in the session
      console.log("*".repeat(50));
      console.log("req.session");
      console.log(req.session);
      console.log("req.session.userId");
      console.log(req.session.userId);
      console.log("*".repeat(50));
      res.send(newUserEntry._id);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

export async function login(req, res) {
  try {
    const askedUserName = req.body.username;
    const askedPassword = req.body.password;
    const user = await getUser(askedUserName);

    if (!user) {
      res.json("User not found.");
    } else if (user.password === askedPassword) {
      // regenerate the session, which is good practice to help
      // guard against forms of session fixation
      req.session.regenerate(async function (err) {
        if (err) next(err);

        // store user information in session, typically a user id
        await updateInfo(req.body.username, { lastLogin: new Date() });
        const updatedUser = await getUser(req.body.username);
        req.session.userId = updatedUser._id; // Store user ID in the session

        //   req.session.userId = req.body.username
        console.log("*".repeat(50));
        console.log("before save");
        console.log("req.session");
        console.log(req.session);
        console.log("*".repeat(50));

        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(function (err) {
          if (err) return next(err);
          // res.redirect('/')
        });
        console.log("*".repeat(50));
        console.log("after save");
        console.log("req.session");
        console.log(req.session);
        console.log("*".repeat(50));
        res.json("Correct");
      });
    } else {
      res.json("Not allowed");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

export function logout(req, res) {
  // logout logic
  console.log("*".repeat(50));
  console.log("before logout");
  console.log("req.session");
  console.log(req.session);
  console.log("*".repeat(50));
  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  req.session.userId = null;
  console.log("*".repeat(50));
  console.log("logout before save");
  console.log("req.session");
  console.log(req.session);
  console.log("*".repeat(50));
  req.session.save(function (err) {
    if (err) next(err);

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err);
      //   res.redirect('/')
    });
  });
  console.log("*".repeat(50));
  console.log("logout after save");
  console.log("req.session");
  console.log(req.session);
  console.log("*".repeat(50));
  res.json("Server: logged out successfully.");
}

export function authenticate(req, res, next) {
  console.log("*".repeat(50));
  console.log("authenticate:**********");
  console.log("req.session.userId");
  console.log(req.session.userId);
  console.log("req.session");
  console.log(req.session);
  console.log("*".repeat(50));
  if (req.session.userId) {
    next();
  } else {
    res.status(404).json({ message: "Unauthorized. Please log in." });
  }
}

export async function profile(req, res) {
  // it goes through authenticate function above
  // Fetch user data using req.session.userId
  console.log("*".repeat(50));
  console.log("Profile:***************");
  console.log("req.session.userId");
  console.log(req.session.userId);
  console.log("*".repeat(50));
  const user = await id2User(req.session.userId);
  res.json(user);
}

export function test(req, res) {
  res.json(req.session);
}
