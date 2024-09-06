import mongoose from "mongoose";
import { User } from "./mongooseSchema.js";

import { configDotenv } from "dotenv";
const envLoaded = configDotenv('../.env')
const mongoPassword = process.env.mongoPassword;
const db = "chat";
const mongoURI =
  `mongodb+srv://davoodwadi:<password>@cluster0.xv9un.mongodb.net/${db}?retryWrites=true&w=majority&appName=Cluster0`.replace(
    "<password>",
    mongoPassword
  );

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// const user = await User.findOne({ username: "mr" });
// console.log("resp", user.username);

export async function addUser(info) {
  try {
    // Create a new user instance
    const newUser = new User({
      username: info.username,
      displayName: info.displayName,
      givenName: info.givenName,
      familyName: info.familyName,
      email: info.email,
      emails: info.emails,
      photo: info.photo,
      photos: info.photos,
      sessions: [], // Start with no sessions
    });

    // Save the user to the database
    await newUser.save();
    console.log("User added successfully:", newUser);
  } catch (error) {
    console.error("Error adding user:", error.message);
  }
}
