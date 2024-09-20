import mongoose from "mongoose";
import { User } from "./mongooseSchema.js";

import { configDotenv } from "dotenv";
const envLoaded = configDotenv("../.env");
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

// size of document
// const userDb = await User.findOne({ username: "davoodwadi@gmail.com" });
// // Convert the Mongoose document to JSON
// const userJson = userDb.toObject();
// // Calculate the size of the JSON object in bytes
// const docSize = Buffer.byteLength(JSON.stringify(userJson), "utf8");
// // Log the size in bytes and kilobytes
// console.log(`Document size: ${docSize} bytes`);
// console.log(`Document size: ${(docSize / 1024).toFixed(2)} KB`);

// const user = await User.findOne({ username: "mr" });
// user.checkoutSessions.push({
//   id: 'cs_test_a1PZ6d3KslUxyfBrDzgyavIA0WiGKcKOIKYgrBU4bXJqTHGwK6AsIr827q',
//   object: 'checkout.session',
//   after_expiration: null,
//   allow_promotion_codes: null,
//   amount_subtotal: 499,
//   amount_total: 499,
//   automatic_tax: { enabled: false, liability: null, status: null },
//   billing_address_collection: null,
//   cancel_url: 'https://test.spreed.chat/?session_id=0',
//   client_reference_id: null,

// })
// await user.save()
export async function findCheckoutSessionById(sessionId) {
  const result = await User.findOne(
    // { "checkoutSessions.sessionId": sessionId }
    { checkoutSessions: { $elemMatch: { id: sessionId } } }
  );

  return result ? result : null; // Return the found session or null
}

// const result = await User.findOne(
//   { checkoutSessions: { $elemMatch: { id: 'cs_test_a1PZ6d3KslUxyfBrDzgyavIA0WiGKcKOIKYgrBU4bXJqTHGwK6AsIr827q' } } }
// );
export async function updateCheckoutSessionById(sessionId, newSessionData) {
  const result = await User.findOneAndUpdate(
    { "checkoutSessions.id": sessionId }, // Query to find the user with the specific session id
    {
      $set: {
        "checkoutSessions.$": newSessionData, // Update the matching session
        // "tokensRemaining": { $add: [ "$tokensRemaining", "$maxTokensPerMonth" ] } // Update tokensRemaining
      },
    },
    { new: true } // Option to return the updated document
  );

  return result ? result : null; // Return the updated user document or null
}
// const sessionId = 'cs_test_a1eWMGRhSwMwqysqhL64XDCm1r7oGyQaYRBfjDOAVKoJ9GVXz19jMLWVy6'
// const oldUser = await findCheckoutSessionById(sessionId)
// const newSession = {
//   id: sessionId, // same id
//   object: 'test',
//   after_expiration: null,
//   allow_promotion_codes: null,
//   amount_subtotal: 600, // updated amount
//   amount_total: 600, // updated amount
//   automatic_tax: {}, // assuming you want to replace this with an empty object or new data
//   billing_address_collection: null,
//   cancel_url: 'https://new.url.com/cancel', // new cancel URL
//   client_reference_id: null
// };

// const newUser = await updateCheckoutSessionById(sessionId, newSession)
// console.log(oldUser)
// console.log(newUser)

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
