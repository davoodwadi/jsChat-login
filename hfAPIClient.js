// import fetch from "node-fetch";
import { getResponseServer } from "./apiModule.js";
let bot_default_message = `To ensure that messages in the chat interface wrap and display as multiline when the text is too long to fit in one line, you need to update the CSS to allow for word wrapping and handling overflow appropriately.

Here’s how you can adjust the CSS to ensure that messages are displayed in multiple lines within the chat interface: `

const apiUrl = "https://api-inference.huggingface.co/models/gpt2"; // API endpoint on your server

document.addEventListener('DOMContentLoaded', (globalEvent) => {
const messagesContainer = document.getElementById('messages');

const dots = createDots();

let allMessages = ''

// set message ids
// here we are overwriting the ids in html
let messageElement = document.getElementById('first-message');

let idCounter = 0;
for (let messageElement of messagesContainer.children){  
    messageElement.role = messageElement.classList['2']
    messageElement.counter = idCounter
    messageElement.name = `${messageElement.role}-${idCounter}`
    messageElement.style.height = 'auto'
    // autoResizeTextarea()
    idCounter++
}
 
// add evenListeners
messageElement.addEventListener('input', () => {
    autoExpandTextarea(messageElement);
});

messageElement.addEventListener('blur', () => {
    resetTextareaHeight(messageElement);
});

messageElement.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default behavior of adding a new line
        
        logEvent(event.target.textContent.trim());
        // console.log(`div: ${messageElement.textContent.trim()}`)
        event.target.blur();
        // autoResizeTextarea();
        }
    });

const systemTemplate = `<|start_header_id|>system<|end_header_id|>\n{text}<|eot_id|>\n\n`;
const systemMessage = `You are a helpful assistant. You respond with brief, to the point, and useful responses.`;
const systemPrompt = systemTemplate.replace('{text}', systemMessage);
const userTemplate = `<|start_header_id|>user<|end_header_id|>\n\`\`\`{text}\`\`\`<|eot_id|>\n\n`;
const assistantTag = `<|start_header_id|>assistant<|end_header_id|>\n`
const assistantEOT = `<|eot_id|>\n\n`
const assistantPrompt = `${assistantTag}{text}${assistantEOT}`

function createMessagesUpToThisPoint(target){
    // reset allMessages each time
    allMessages = systemPrompt
    
    console.log('test loop');
    for (let i = 0; i<=target.counter; i++){
        let test = messagesContainer.children[i];
        let testRole = test.role;
        let testContent = test.textContent;
        
        if (testRole==='user'){
            console.log(`adding ${testContent} as user`);
            let userPrompt = userTemplate.replace('{text}', testContent);
            allMessages += userPrompt
            // console.log(allMessages)
        } else {
            console.log(`adding ${testContent} as bot`);
            let assistantPrompt = assistantTag + testContent + assistantEOT;
            allMessages += assistantPrompt;
        }
    };
    // finally add assistant prompt
    allMessages += assistantTag
    console.log('*'.repeat(20));
    console.log('allMessages');
    console.log(allMessages);
    console.log('*'.repeat(20));
    return allMessages
};

async function logEvent(text){
    const target = event.target

    if ((target.counter+1)<idCounter && target.role==='user'){ //old and user
        // console.log(`old convo ${target.counter}-${idCounter}`);
        // bot already exists at target.counter + 1; put text there
        // const responseGPT = await makeApiCall(target.textContent.trim());
        // const final_text = responseGPT.message.content.trim();
        // set dots for old bot message
        const oldMessageElement = messagesContainer.children[target.counter + 1];
        messagesContainer.replaceChild(dots, oldMessageElement)
        
        // get the current target and corresponding message history:
        allMessages = createMessagesUpToThisPoint(target);
        let final_text = await getResponseServer(allMessages);
        // let final_text = await getDummyMessage();
        final_text = final_text.trim();
        // final_text = JSON.stringify(final_text);
        // final_text = final_text[0].generated_text.trim()
        oldMessageElement.textContent = final_text;
        messagesContainer.replaceChild(oldMessageElement, dots)
        // messagesContainer.children[target.counter+1].textContent = final_text // bot textarea; 0 indexing
        // autoResizeTextarea(); // readjust the boxes 
        scrollToTopOfLastMessage(oldMessageElement);
        // scrollToLatestMessage(oldMessageElement)
    } else if ( target.role==='user') { // latest and user
        // const responseGPT = await makeApiCall(target.textContent.trim());
        // const final_text = responseGPT.message.content.trim();
        
        // let them wait
        messagesContainer.appendChild(dots);
        scrollToLatestMessage(dots);

        // let final_text = await getDummyMessage();
        
        allMessages = createMessagesUpToThisPoint(target);
        // console.log('allMessages');
        // console.log(allMessages);
        
        let final_text = await getResponseServer(allMessages);
        final_text = final_text.trim();
        allMessages += final_text + assistantEOT;
        
        // console.log('allMessages');
        // console.log(allMessages);
        // final_text = JSON.stringify(final_text);
        // final_text = final_text[0].generated_text.trim()
        // console.log(final_text)

        // remove dots
        messagesContainer.removeChild(dots)
    
        let messageElement = addMessage('bot', final_text); // add bot textarea
        
        // messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' }); // scroll bot
        scrollToLatestMessage(messageElement);
        
        messageElement = addMessage('user', ''); // add user text area
        // autoResizeTextarea(); // readjust the boxes
        // add even listeners
        messageElement.addEventListener('input', () => {
            autoExpandTextarea(messageElement);
        });
        
        messageElement.addEventListener('blur', () => {
            resetTextareaHeight(messageElement);
        });
        messageElement.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent the default behavior of adding a new line
        
                logEvent(event.target.textContent.trim());

                event.target.blur();
                // autoResizeTextarea(); // readjust the boxes
                }
            });// listen to user
    };
}

function addMessage(sender, text) {
    const messageElement = document.createElement('div');
    messagesContainer.appendChild(messageElement);
    // autoResizeTextarea();
    // if (sender==='user'){
    //     messageElement.classList.add('editable')    
    // };
    messageElement.classList.add('message', sender);
    messageElement.textContent = text;
    messageElement.style.width = "100%"
    messageElement.style.height = "auto"
    messageElement.contentEditable = true
    
    messageElement.role = messageElement.classList['1'];
    messageElement.name = `${messageElement.role}-${idCounter}`
    messageElement.counter = idCounter;
    idCounter++
    return messageElement
}


async function makeApiCall(userMessage) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: userMessage},
                ],
                model: "gpt-4o-mini",
                max_tokens: 100
            })
        });
    
        const data = await response.json();
        console.log(data);
        return data
    } catch (error) {
        console.error('Error:', error);
        console.error(error);
    }
}

function scrollToLatestMessage(latestMessage) {
    const chatContainer = document.getElementById('messages');

    // Adjust scroll position to show some of the previous messages
    const offset = 200; // Adjust this value as needed
    // console.log(`before scrolltop${chatContainer.scrollTop}`)
    chatContainer.scrollTop = latestMessage.offsetTop - offset;
    // console.log(`after scrolltop${chatContainer.scrollTop}`)
}

function scrollToTopOfLastMessage(element) {
    // const lastMessage = messagesContainer.lastElementChild;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function autoExpandTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}
function resetTextareaHeight(textarea) {
    textarea.style.height = '10px'; // Set to 'auto' for min-height behavior
}

function showChildren(){
    // loop through messagesContainer
    console.log('*'.repeat(20))
    for (child of messagesContainer.children){
        console.log(child.counter)
    }
    console.log('*'.repeat(20))
    // 
}

async function getDummyMessage() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(bot_default_message);
        }, 1000); // 0.5 second delay
    });
}

function createDots(){
    const dots = document.createElement('div');
    dots.classList.add('message', 'bot', 'dots-message');
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('dots-container');
    
    const singleDot1 = document.createElement('div')
    singleDot1.classList.add('dot')
    const singleDot2 = document.createElement('div')
    singleDot2.classList.add('dot')
    const singleDot3 = document.createElement('div')
    singleDot3.classList.add('dot')
    
    //connect them together
    dots.appendChild(dotsContainer)
    dotsContainer.appendChild(singleDot1)
    dotsContainer.appendChild(singleDot2)
    dotsContainer.appendChild(singleDot3)    
    return dots
};

})