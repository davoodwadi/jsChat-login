import { configDotenv } from "dotenv";
const envLoaded = configDotenv("../.env");

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET);

// export const product = await stripe.products.create({
//     name: '100k tokens',
//     description: '100,000 tokens',
//   })
// export const price = await stripe.prices.create({
//     unit_amount: 499,
//     currency: 'usd',
//     product: product.id,
// })

export const product = await stripe.products.retrieve("prod_QsDFovqJKnZgDQ");
export const price = await stripe.prices.retrieve(
  "price_1Q0Soy05Yzf9GyoIVfw0t9oA"
);
// export const prices = await stripe.prices.list()
// console.log(prices)

console.log(
  "Success! Here is your starter subscription product id: " + product.id
);
console.log("Success! Here is your starter subscription price id: " + price.id);
