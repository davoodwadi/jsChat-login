import {
  encode,
  encodeChat,
  decode,
  isWithinTokenLimit,
  encodeGenerator,
  decodeGenerator,
  decodeAsyncGenerator,
} from "gpt-tokenizer/model/gpt-4o";

const text = "Hello world. My name is brad lee she he zhe";
const encoded = encode(text);
console.log("encoded", encoded);
console.log("encoded.length", encoded.length);

const decoded = decode(encoded);
console.log("decoded", decoded);
console.log("decoded.length", decoded.length);

const tokenLimit = 10;

const withinTokenLimit = isWithinTokenLimit(text, tokenLimit);
console.log("withinTokenLimit: ", withinTokenLimit);

const messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant. You respond to my questions with brief, to the point, and useful responses.",
  },
  { role: "user", content: "hi" },
];

const chatTokens = encodeChat(messages);
console.log("chatTokens", chatTokens);
console.log("chatTokens.length", chatTokens.length);
