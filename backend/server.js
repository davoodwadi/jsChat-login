import {getDB, getUser, addUser, getAllMatchingUsers, getLatestSession, updateInfo, addSaveContainer, id2User} from './mongo.js' 
import express from 'express'
import session from 'express-session';
import MongoDBStore from 'connect-mongodb-session';
import path from 'path'
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { load, save, signup, login, authenticate, logout, profile, test } from './loginRequests.js';
import { getHfCompletions, getStreamGPT, headStreamGpt, hfCompletions, hfCompletions70b, hfCompletions8b, streamGpt } from './apiRequests.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const isHttps = true;
const port = process.env.PORT || 3000;

const app = express();
// mongodb session
const store = new MongoDBStore(session);
const mongoPassword = process.env.mongoPassword
const uri = "mongodb+srv://davoodwadi:<password>@cluster0.xv9un.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0".replace('<password>', mongoPassword)

const mongodbStore = new store({
  uri: uri,
  databaseName: 'chat',
  collection: 'chatSessions',
}, function(error) {
  // Should have gotten an error
  console.log('*****session DB error:', error)
});

// Catch errors
mongodbStore.on('error', (error) => {
  console.log('*****theres an error in the session DB*******')
  console.error(error);
});

console.log('process.env.NODE_ENV')
console.log(process.env.NODE_ENV)

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));


app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  store: mongodbStore,
}))

app.use(express.json())


// Route for the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// test session storage
app.get('/test-session', test);

app.get('/users/load', load);
app.post('/users/save', save);

app.post('/users/signup', signup)
app.post('/users/login', login);
app.get('/users/logout', logout);

app.get('/users/profile', authenticate, profile);



// LLM calls start
// Endpoint to handle API requests
// app.get("/", (req, res) => res.type('html').send(html));
// openai endpoint
app.post('/api/gpt/completions/stream', streamGpt);
// Adding a HEAD method for the touch
app.head('/api/gpt/completions/stream', headStreamGpt);
app.get('/api/gpt/completions/stream', getStreamGPT);

app.post('/api/hf/8b/completions', hfCompletions8b);
app.post('/api/hf/70b/completions', hfCompletions70b);
app.post('/api/hf/completions', hfCompletions);
app.get('/api/hf/completions', getHfCompletions);
// LLM calls end

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});