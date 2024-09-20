import mongoose from "mongoose";

export const MAX_TOKENS_PER_MONTH = 100000; // 100k tokens
// Define the User schema with nested sessions
const userSchema = new mongoose.Schema({
  id: { type: String },
  username: { type: String, required: true, unique: true },
  displayName: { type: String },
  givenName: { type: String },
  familyName: { type: String },
  email: { type: String },
  emails: [
    {
      value: { type: String },
      verified: { type: Boolean },
    },
  ],
  photo: { type: String },
  photos: [{ value: {} }],
  sessions: [
    {
      time: { type: Date },
      saveContainer: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  quotaRefreshedAt: { type: Date, default: Date.now },
  tokensConsumed: { type: Number, default: 0 },
  tokensRemaining: { type: Number, default: MAX_TOKENS_PER_MONTH },
  maxTokensPerMonth: { type: Number, default: MAX_TOKENS_PER_MONTH },
  lastLogin: { type: Date, default: Date.now },
  checkoutSessions: {
    type: [mongoose.Schema.Types.Mixed], // Array of any objects
    default: [], // Default value as an empty array
  },
});

// Create the model from the schema
export const User = mongoose.model("plans", userSchema);
