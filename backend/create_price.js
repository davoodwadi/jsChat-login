import { configDotenv } from "dotenv";
const envLoaded = configDotenv('../.env')

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY_TEST);


// export const product = await stripe.products.create({
//     name: '100k tokens',
//     description: '100,000 tokens',
//   })
// export const price = await stripe.prices.create({
//     unit_amount: 499,
//     currency: 'usd',
//     product: product.id,
// })

export const product = await stripe.products.retrieve("prod_QnXfSBpbwIMrrY")
export const price = await stripe.prices.retrieve('price_1PvwZr05Yzf9GyoIaPF8HgU6')
// export const prices = await stripe.prices.list()
// console.log(prices)

console.log('Success! Here is your starter subscription product id: ' + product.id);
console.log('Success! Here is your starter subscription price id: ' + price.id);