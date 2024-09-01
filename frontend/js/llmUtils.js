let bot_default_message = `To load a CSV file using Python, you can use the \`pandas\` library, which is a powerful tool for data manipulation and analysis. Here's a basic example:

\`\`\`python
import pandas as pd

# Load the CSV file
df = pd.read_csv('your_file.csv')

# Display the first few rows of the DataFrame
print(df.head())
\`\`\`

In this code:
- \`pandas\` is imported and abbreviated as \`pd\`.
- The \`pd.read_csv()\` function is used to read the CSV file. You need to replace \`'your_file.csv'\` with the actual path to your CSV file.
- \`df.head()\` shows the first five rows of the DataFrame by default.

Make sure you have the \`pandas\` library installed. You can install it using pip if you haven't already:

\`\`\`bash
pip install pandas
\`\`\`

Let me know if you need help with anything else!`;
const systemTemplate = `<|start_header_id|>system<|end_header_id|>\n{text}<|eot_id|>\n\n`;
// const systemMessage = `You are a helpful assistant. You respond to my questions with brief, to the point, and useful responses. My questions are in triple backtics`;
const systemPrompt = systemTemplate.replace("{text}", systemMessage);
const userTemplateWithTicks = `<|start_header_id|>user<|end_header_id|>\n\`\`\`{text}\`\`\`<|eot_id|>\n\n`;
const assistantTag = `<|start_header_id|>assistant<|end_header_id|>\n`;
const assistantEOT = `<|eot_id|>\n\n`;
const assistantPrompt = `${assistantTag}{text}${assistantEOT}`;
const systemMessage = "";
const userTemplateNoTicks = `<|start_header_id|>user<|end_header_id|>\n{text}<|eot_id|>\n\n`;
