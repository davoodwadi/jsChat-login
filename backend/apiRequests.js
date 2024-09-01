import { OpenAI } from "openai";
import fetch from "node-fetch";
import { encodeChat } from "gpt-tokenizer/model/gpt-4o";
import { User, MAX_TOKENS_PER_MONTH } from "./mongooseSchema.js";

const openaiToken = process.env.openaiintelChainKey;
const hfToken = process.env.HF_TOKEN;

const openai = new OpenAI({ apiKey: openaiToken });
// HF-api endpoint
const hfUrl8b =
  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";
const hfUrl70b =
  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct";
const hfUrl405b =
  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-405B-Instruct";

export async function streamGpt(req, res) {
  try {
    // touching
    const ipAddress = req.headers["touch"] || req.socket.remoteAddress;
    console.log("ipAddress");
    console.log(ipAddress);
    if (ipAddress === "yes") {
      return res.status(200).send("touch success");
    }

    // get the user

    let userDb;
    try {
      userDb = await User.findOne({ username: req.user.username });
      console.log(
        "*".repeat(10),
        "[before]: ",
        userDb.tokensRemaining,
        " left",
        "*".repeat(10)
      );
      const tempMessagesTokens = encodeChat(req.body.messages);

      if (userDb.tokensRemaining - tempMessagesTokens.length <= 0) {
        // need to buy credits
        console.log(
          "*".repeat(10),
          "need to buy tokens: ",
          "messagetokens:",
          tempMessagesTokens.length,
          "; tokensRemaining:",
          userDb.tokensRemaining,
          " left ",
          "*".repeat(10)
        );
        return res.status(404).send("no tokens left");
      } else {
        // good to go
        console.log(
          "*".repeat(10),
          "[inside] good to go: ",
          "messagetokens:",
          tempMessagesTokens.length,
          "; tokensRemaining:",
          userDb.tokensRemaining,
          " left ",
          "*".repeat(10)
        );
      }
    } catch (error) {
      console.log(error);
    }
    // console.log(
    //   "*".repeat(10),
    //   "[outside] good to go: ",
    //   userDb.tokensRemaining,
    //   " left",
    //   "*".repeat(10)
    // );
    // req.body is the post from client
    const stream = openai.beta.chat.completions.stream({
      model: "gpt-4o-mini",
      messages: req.body.messages,
      max_tokens: req.body.max_tokens,
      stream: true,
    });

    res.header("Content-Type", "text/plain");
    // Sends each content stream chunk-by-chunk, such that the client
    // ultimately receives a single string.
    let assistantMessage = ""; // to store assistant response
    for await (const chunk of stream) {
      // console.log(chunk.choices[0]?.delta);
      res.write(chunk.choices[0]?.delta.content || "");
      assistantMessage += chunk.choices[0]?.delta.content || "";
    }
    // before res.end()
    // count tokens and update db
    try {
      const finalTokens = encodeChat([
        ...req.body.messages,
        { role: "assistant", content: assistantMessage },
      ]);
      console.log("********counting tokens********");
      // console.log("assistantMessage: ", [
      //   { role: "assistant", content: assistantMessage },
      // ]);
      // console.log("userDb.tokensConsumed: ", userDb.tokensConsumed);
      // console.log("userDb.tokensRemaining: ", userDb.tokensRemaining);
      userDb.tokensConsumed += finalTokens.length;
      userDb.tokensRemaining -= finalTokens.length;
      // console.log("assistantTokens.length: ", assistantTokens.length);
      // console.log("userDb.tokensConsumed: ", userDb.tokensConsumed);
      // console.log("userDb.tokensRemaining: ", userDb.tokensRemaining);
      // console.log("********END: counting tokens********");
      await userDb.save();

      // check if quota need refresh
      // check if quota need refresh
    } catch (error) {
      console.log(error);
    }

    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "error faced in fetching openai" });
  }
}

export function headStreamGpt(req, res) {
  // You can send back headers as needed
  console.log("HEAD request received");
  res.set("X-Last-Checked", new Date().toUTCString()); // Example header
  res.sendStatus(200); // Responds with 200 OK
}

export async function getStreamGPT(req, res) {
  try {
    console.log("node.js server touched");
    res.json("thank you for touching");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Get Error: Internal Server Error" });
  }
}

export async function hfCompletions8b(req, res) {
  try {
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    };
    // console.log('options')
    // console.log(options)
    let response = await fetch(hfUrl8b, options);
    response = await response.json();
    // console.log('response')
    // console.log(response)
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error });
  }
}

export async function hfCompletions70b(req, res) {
  try {
    // const { inputs, parameters } = req.body;
    // console.log('req.body');
    // console.log(req.body);

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    };
    // console.log('options')
    // console.log(options)
    let response = await fetch(hfUrl70b, options);
    response = await response.json();
    console.log("response");
    console.log(response);
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getHfCompletions(req, res) {
  try {
    console.log("welcome to node.js");
    res.json("welcome to njs");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function hfCompletions(req, res) {
  try {
    // const { inputs, parameters } = req.body;
    console.log("req.body");
    console.log(req.body);

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    };
    console.log("options");
    console.log(options);
    let response = await fetch(hfUrl8b, options);
    response = await response.json();
    console.log("response");
    console.log(response);
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Davood Wadi. Welcome to HF API!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Hello from Render!
    </section>
  </body>
</html>
`;
