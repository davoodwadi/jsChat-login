import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's directory (similar to __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Hello");

const app = express();
const PORT = 3000;

// Define the path to the static files
app.use(express.static(path.join(__dirname, "dist")));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
