// server.js
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

import fetch from 'node-fetch';

import { createClient } from 'redis';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

// set redis client
const client = createClient({
  url: 'redis://127.0.0.1:6379' 
});
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();
console.log(`connected to db: ${client.isReady}`)

await saveMessages('John', 'hiiii');
const latest = await loadLatestMessages('John')
console.log(latest)

app.post('/api/redis/save', async (req, res) => {
  try {
    const body = req.body
    console.log('body')
    console.log(body.username)
    const response = await saveMessages(body.username, body.saveContainer)
    res.json(response)
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error });
  }
});
app.post('/api/redis/load', async (req, res) => {
  try {
    const body = req.body
    console.log('body')
    console.log(body.username)
    const response = await loadLatestMessages(body.username)
    // console.log('response')
    // console.log(response)
    res.json({saveContainer: response})
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error });
  }
});
//

const openaiToken = process.env.openaiintelChainKey;
const hfToken = process.env.HF_TOKEN;

const openai = new OpenAI({apiKey: openaiToken});
// HF-api endpoint
const hfUrl8b =  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";
const hfUrl70b =  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct";
const hfUrl405b =  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-405B-Instruct";

// Endpoint to handle API requests
app.get("/", (req, res) => res.type('html').send(html));


// openai endpoint
app.post('/api/gpt/completions/stream', async (req, res) => {
  try {
    // touching
    const ipAddress = req.headers['touch'] || req.socket.remoteAddress;
    console.log('ipAddress')
    console.log(ipAddress)
    if (ipAddress === 'yes') {
      return res.status(200).send('touch success');
    }

    // req.body is the post from client
    const stream = openai.beta.chat.completions.stream({
      model: "gpt-4o-mini",
      messages: req.body.messages,
      max_tokens: req.body.max_tokens,
      stream: true,
    });
    
    res.header('Content-Type', 'text/plain');
    // Sends each content stream chunk-by-chunk, such that the client
    // ultimately receives a single string.
    for await (const chunk of stream) {
      res.write(chunk.choices[0]?.delta.content || '');
    }

    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error faced in fetching openai' });
  }
});

// Adding a HEAD method for the touch
app.head('/api/gpt/completions/stream', (req, res) => {
  // You can send back headers as needed
  console.log('HEAD request received');
  res.set('X-Last-Checked', new Date().toUTCString());  // Example header
  res.sendStatus(200); // Responds with 200 OK
});



app.get('/api/gpt/completions/stream', async (req, res) => {
  try {
      console.log('node.js server touched')
      res.json('thank you for touching')

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Get Error: Internal Server Error' });
  }
});


app.post('/api/hf/8b/completions', async (req, res) => {
    try {

        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hfToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        };
        // console.log('options')
        // console.log(options)
        let response = await fetch(hfUrl8b, options)
        response = await response.json()
        // console.log('response')
        // console.log(response)
        res.json(response)

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error });
    }
});

app.post('/api/hf/70b/completions', async (req, res) => {
  try {
      // const { inputs, parameters } = req.body;
      // console.log('req.body');
      // console.log(req.body);

      const options = {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${hfToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
      };
      // console.log('options')
      // console.log(options)
      let response = await fetch(hfUrl70b, options)
      response = await response.json()
      console.log('response')
      console.log(response)
      res.json(response)

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/hf/completions', async (req, res) => {
    try {
        console.log('welcome to node.js')
        res.json('welcome to njs')

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/api/hf/completions', async (req, res) => {
  try {
      // const { inputs, parameters } = req.body;
      console.log('req.body');
      console.log(req.body);

      const options = {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${hfToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
      };
      console.log('options')
      console.log(options)
      let response = await fetch(hfUrl8b, options)
      response = await response.json()
      console.log('response')
      console.log(response)
      res.json(response)

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



async function saveMessages(username, html){
  const userExists = await client.exists(username)
  // if exists: 1 else 0; 
  const now = new Date();
  console.log(userExists==1)
  if (userExists===0){ // new user
      console.log('new user: ', username)
      // set counter
      let resp = await client.json.set(username, '$', {counter: 1})

      resp = await client.json.set(username, '$.1', { // set content at the counter
          'time': now,
          'saveContainer': html}
      )
  } else { // old user
      console.log('old user: ', username)
      // get counter
      const counter = await client.json.get(username, {
          path: '$.counter'
      })
      
      const counterNext = counter[0] + 1;
      
      let resp = await client.json.set(username, '$.'+counterNext, { // set content at the counter
          'time': now,
          'saveContainer': html}
      )
      
      // increment the counter
      resp = await client.json.numIncrBy(username, '$.counter', 1);
      console.log('***saved successfully***')
      return resp
  }
}

async function loadLatestMessages(username){
  // return undefined if user not exists
  const counter = await client.json.get(username, {path: '$.counter'})
  if (!counter){
      console.log('undefined counter')
      return undefined
  } else{
      const path = '$.{counter}.saveContainer'.replace('{counter}', counter[0])
      const html = await client.json.get(username, {'path': path})
      console.log('***loaded successfully***')
      return html[0]
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
`