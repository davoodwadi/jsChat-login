import mongoose from "mongoose";
import { User } from "./mongooseSchema.js";
const mongoPassword = process.env.mongoPassword;
// const db = "chat";
// const mongoURI =
//   `mongodb+srv://davoodwadi:<password>@cluster0.xv9un.mongodb.net/${db}?retryWrites=true&w=majority&appName=Cluster0`.replace(
//     "<password>",
//     mongoPassword
//   );

// mongoose
//   .connect(mongoURI)
//   .then(() => console.log("MongoDB connected successfully"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// manual update
// const userDb = await User.findOne({ username: "davoodwadi@gmail.com" });
// const customQuotaRefreshedAt = new Date(2024, 5, 1);

// userDb.quotaRefreshedAt = customQuotaRefreshedAt;
// userDb.maxTokensPerMonth = 100000;
// await userDb.save();
// const userDbUpdated = await User.findOne({ username: "davoodwadi@gmail.com" });
// console.log(userDbUpdated);
// END: manual update

// console.log("quotaRefreshedAt ", quotaRefreshedAt);
// refreshQuota(userDb);
// console.log(userDb);

export async function refreshQuota(userDb) {
  let newQuotaRefreshedAt = null;
  const quotaRefreshedAt = userDb.quotaRefreshedAt;
  const now = new Date();
  console.log("quotaRefreshedAt ", quotaRefreshedAt);
  console.log("now ", now);

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();

  const prevRefreshYear = quotaRefreshedAt.getFullYear();
  const prevRefreshMonth = quotaRefreshedAt.getMonth();
  const prevRefreshDay = quotaRefreshedAt.getDate();

  //   console.log(`Now: Year: ${nowYear}, Month: ${nowMonth}, Day: ${nowDay}`);

  const thisMonthYear = nowYear;
  const thisMonthMonth = nowMonth;
  const thisMonthDay = prevRefreshDay;
  //   console.log(
  //     `This month Year: ${thisMonthYear}, Month: ${thisMonthMonth}, Day: ${thisMonthDay}`
  //   );

  const thisMonthRefresh = new Date(
    thisMonthYear,
    thisMonthMonth,
    thisMonthDay
  );
  const refreshThisMonth = now > thisMonthRefresh;
  //   console.log(`is now bigger than thisMonthRefresh: ${refreshThisMonth}`);
  if (refreshThisMonth) {
    const thisMonthRefreshNewer = thisMonthRefresh > quotaRefreshedAt;
    // console.log(`thisMonthRefreshNewer: ${thisMonthRefreshNewer}`);
    if (thisMonthRefreshNewer) {
      // renew quota
      newQuotaRefreshedAt = thisMonthRefresh;
      console.log(`newQuotaRefreshedAt: `, newQuotaRefreshedAt);
    }
  } else {
    const lastMonthRefresh = new Date(
      thisMonthYear,
      thisMonthMonth - 1,
      thisMonthDay
    );
    const lastMonthRefreshNewer = lastMonthRefresh > quotaRefreshedAt;
    // console.log(`lastMonthRefreshNewer: ${lastMonthRefreshNewer}`);
    if (lastMonthRefreshNewer) {
      // renew quota
      newQuotaRefreshedAt = lastMonthRefresh;
      console.log(`newQuotaRefreshedAt: `, newQuotaRefreshedAt);
    }
  }
  console.log("newQuotaRefreshedAt: ", newQuotaRefreshedAt);
  if (newQuotaRefreshedAt) {
    // refresh the quota
    userDb.tokensConsumed = 0;
    userDb.tokensRemaining = userDb.maxTokensPerMonth;
    userDb.quotaRefreshedAt = newQuotaRefreshedAt;
    await userDb.save();
    return true;
  }
  return null;
}
