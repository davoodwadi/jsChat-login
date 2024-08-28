import markdownIt from 'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm'
import { getResponseServer } from "./apiModule.js";
import { mdToHTML } from './md.js';

const apiUrlGPT = 'https://jschatapi.onrender.com/api/gpt/completions/stream' 
// const apiUrlGPT = 'http://localhost:4000/api/gpt/completions/stream' 
const decoder = new TextDecoder();
let bot_default_message = `To ensure that messages in the chat interface wrap and display as multiline when the text is too long to fit in one line, you need to update the CSS to allow for word wrapping and handling overflow appropriately.
 
Here’s how you can adjust the CSS to ensure that messages are displayed in multiple lines within the chat interface: `
const systemTemplate = `<|start_header_id|>system<|end_header_id|>\n{text}<|eot_id|>\n\n`;
// const systemMessage = `You are a helpful assistant. You respond to my questions with brief, to the point, and useful responses. My questions are in triple backtics`;
const systemMessage = ""
const systemPrompt = systemTemplate.replace('{text}', systemMessage);
const userTemplateWithTicks = `<|start_header_id|>user<|end_header_id|>\n\`\`\`{text}\`\`\`<|eot_id|>\n\n`;
const userTemplateNoTicks = `<|start_header_id|>user<|end_header_id|>\n{text}<|eot_id|>\n\n`;
const assistantTag = `<|start_header_id|>assistant<|end_header_id|>\n`
const assistantEOT = `<|eot_id|>\n\n`
const assistantPrompt = `${assistantTag}{text}${assistantEOT}`
const log = console.log

const md = markdownIt({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre><code class="hljs">' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        } catch (__) {}
      }
  
      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });


async function handleDOMContentLoaded() {
    const gpt = true;
    const max_tokens = 2000;
    // test different prompts:
    const systemMessageFull = `You are a helpful assistant. You respond to my questions with brief, to the point, and useful responses.`;
    

    let messageElement = document.getElementById('first-message')
    let container = messageElement.parentElement;

    const dots = createDots();
    
    let idCounter = 0;
    
    messageElement.role = 'user'
    messageElement.counter = idCounter
    messageElement.name = `${messageElement.role}-${idCounter}`
    idCounter++

    // branch-container logic:
    // branch
    //  user
    //  bot
    //  branch-container
    //      branch
    //          user
    //          bot        
    // event listener for first-message  
    messageElement.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' &&!event.shiftKey) {
            event.preventDefault(); // Prevent the default behavior of adding a new line
            // add branch-container if it doesn't have it
            // add branch
            // add bot
            // (optional) add empty user
            logEvent(event);
            event.target.oldContent = event.target.textContent
            // console.log(event.target.parentElement)
            // console.log(`div entered: ${event.target.textContent.trim()}`)
            event.target.blur();
        }});
    //
    async function logEvent(event){
        let target = event.target
        let branch = target.parentElement
        let branchContainer = branch.parentElement
        let elementToFocus
        
        // console.log(`oldContent: ${target.oldContent}`)
        const oldContent = target.oldContent
        // console.log(`triggeredBefore ${target.triggeredBefore}`)

        if ((target.triggeredBefore) && target.role==='user'){//old and user
            // console.log('old box')
            // add new branch
            branch = document.createElement('div')
            branch.classList.add('branch')
            branchContainer.appendChild(branch)
            // add modified target
            messageElement = await createMessageElement('user');
            messageElement.textContent = target.textContent;
            messageElement.oldContent = messageElement.textContent
            messageElement.triggeredBefore = true;
            branch.appendChild(messageElement);
            // set element to focus to
            elementToFocus = messageElement;
            elementToFocus.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
            // set the old content
            console.log(`setting target's content to ${oldContent}`)
            target.textContent = oldContent


            // add dots
            branch.appendChild(dots)

            // get llm messages
            const elementArray = createElementArray(messageElement)
            
            if (gpt){
                let messages = createMessageChainGPT(elementArray)
                console.log(JSON.stringify(messages))
                messageElement = await createMessageElement('bot', messages, branch);
                
            } else {
                let messages = createMessageChain(elementArray)
                messages += assistantTag
                console.log(messages)
    
                // add bot and empty user 
                messageElement = await createMessageElement('bot', messages);
                branch.replaceChild(messageElement, dots)
            }
            
            
            // create branch-container within branch.        
            let newBranchContainer = document.createElement('div');
            newBranchContainer.classList.add('branch-container');
            branch.appendChild(newBranchContainer);
            // create branch within newcontainer
            let newBranch = document.createElement('div');
            newBranch.classList.add('branch');
            newBranchContainer.appendChild(newBranch)

            messageElement = await createMessageElement('user');
            newBranch.appendChild(messageElement);

            
        } else if ( target.role==='user') { // latest and user
            // console.log('fresh text')
            // add branch
            // branch = document.createElement('div')
            // branch.classList.add('branch')
            // branchContainer.appendChild(branch)
            //
            // branch.appendChild(target)
            // add dots to the branch
            branch.appendChild(dots)
            
            // get llm messages
            const elementArray = createElementArray(target)
            
            if (gpt){
                let messages = createMessageChainGPT(elementArray)
                console.log(JSON.stringify(messages))
                messageElement = await createMessageElement('bot', messages, branch);
                
            } else {
                let messages = createMessageChain(elementArray)
                messages += assistantTag
                console.log(messages)
    
                // add bot message and followup user message
                messageElement = await createMessageElement('bot');
                branch.replaceChild(messageElement, dots)
            }
            
            // set element to focus to
            elementToFocus = messageElement;


            // create branch-container within branch.        
            let newBranchContainer = document.createElement('div');
            newBranchContainer.classList.add('branch-container');
            branch.appendChild(newBranchContainer);
            // create branch within newcontainer
            let newBranch = document.createElement('div');
            newBranch.classList.add('branch');
            newBranchContainer.appendChild(newBranch)

            messageElement = await createMessageElement('user');
            newBranch.appendChild(messageElement);

        }
        target.triggeredBefore = true
        
        if(elementToFocus.role==='bot'){
            elementToFocus.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
        } else {
            elementToFocus.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
        }
    
    };

    
    function getBranchContainer(el){
        for (let child of el.children){
            if (child.classList.contains('branch-container')){
                return child
            }
        }
        return false
    }

    async function createMessageElement(role, pretext, branch){
        let messageElement = document.createElement('div');
        if (role==='bot'){
            messageElement.classList.add('editable', 'message', role);
            messageElement.contentEditable = true;
            // messageElement.textContent = pretext + '\n\n' + (await getDummyMessage())
            if (gpt){
                // let textDecoded = '' 
                console.log(`await fetch(apiUrlGPT`)
                const res = await fetch(apiUrlGPT, {
                    method: 'POST',
                    body: JSON.stringify({
                        messages: pretext,
                        max_tokens: max_tokens,
                    }), 
                    headers: { 'Content-Type': 'application/json' },   
                })

                
                if (!res.ok) {
                    console.error('API call failed with status:', res.status);
                    return; // Handle the error accordingly
                }
                // console.log('Response type:', res.headers.get('Content-Type'));
                
                
                
                messageElement.textContent = ''
                
                messageElement.oldOutput = undefined
                messageElement.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
                messageElement.text = ''
                // console.log(JSON.stringify(res))
                console.log('got stream response => reading it chunk by chunk.')
                
                
                try {
                    const reader = res.body.getReader();
                    let result;
                    while (!(result = await reader.read()).done) {
                        // console.log('inside await while loop')
                        // replace dots
                        if (branch.contains(dots)){
                            // console.log('dots detected')
                            branch.replaceChild(messageElement, dots)
                            // console.log('dots removed')
                        } 
                        const chunk = result.value; // This is a Uint8Array   
                        const textDecoded = new TextDecoder("utf-8").decode(chunk); // Decode chunk to text
                        messageElement.text = messageElement.text + textDecoded;

                        mdToHTML(messageElement.text, messageElement);
                        messageElement.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
                    }
                    reader.releaseLock();
                }
                catch (error) {
                    console.error('Error reading stream:', error)
                }

            } else {
                const llmResponse = await getResponseServer(pretext)
                log(llmResponse)
                mdToHTML(llmResponse, messageElement);
            }
            
            // parse llmResponse from md to html 
            // const html = md.render(llmResponse);
            // const cleanHTML = DOMPurify.sanitize(html);
            // log(cleanHTML)
            // //
            // messageElement.innerHTML = cleanHTML


        } else {
            messageElement.classList.add('editable', 'message', role);
            console.log(messageElement.classList)
            messageElement.contentEditable = true;
            messageElement.setAttribute('data-placeholder', 'New message')
            // event listener
            messageElement.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' &&!event.shiftKey) {
                    event.preventDefault(); // Prevent the default behavior of adding a new line
                    // add branch-container if it doesn't have it
                    // add branch
                    // add bot
                    // (optional) add empty user
                    logEvent(event);
                    event.target.oldContent = event.target.textContent;
                    // console.log(event.target.parentElement)
                    // console.log(`div entered: ${event.target.textContent.trim()}`)
                    event.target.blur();
                }});
            //
        }
        messageElement.role = role;
        messageElement.name = `${messageElement.role}-${idCounter}`
        messageElement.counter = idCounter;
        idCounter++
        // console.log(`role: ${messageElement.role}`)
        return messageElement
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
    
    

    function addMessageElementToArrayReverse(el, messageElementArray){
        for (let i = el.children.length - 1; i >= 0; i--) {
            const child = el.children[i];
            if (child.classList.contains('message') && (!child.classList.contains('dots-message'))){
                messageElementArray.push(child)
            }
            
    }};

    function createElementArray(lastElement){
        let messageElementArray = []
        let element = lastElement;
        while (element.id!=="chat-container"){
            // console.log(element.classList);
            addMessageElementToArrayReverse(element, messageElementArray);
            element = element.parentElement;
        }
        messageElementArray = messageElementArray.reverse()
        // each element from top to bottom
        console.log('*'.repeat(20))
        console.log('messageElementArray')
        console.log(messageElementArray[0].textContent)
        return messageElementArray
    }
    
    // console.log(element.children)

    // create message from chain elements 
    function createMessageChainGPT(messageElementArray){
        // let chainMessages = systemPrompt
        let chainMessages = [{
            role:'system', content:systemMessageFull
        }]
        for (let el of messageElementArray){
            if (el.classList.contains('user')){
                chainMessages.push({
                    role : 'user', 
                    content : el.textContent
                })
                
            } else {
                chainMessages.push({
                    role : 'assistant',
                    content : el.textContent
                })
            
        }}
        return chainMessages
    }
    function createMessageChain(messageElementArray){
        // let chainMessages = systemPrompt
        let chainMessages = ''
        for (let el of messageElementArray){
            if (el.classList.contains('user')){
                // console.log(`user: ${el.textContent}`);
                chainMessages += userTemplateNoTicks.replace('{text}', el.textContent);
            } else {
                // console.log(`bot: ${el.textContent}`);
                chainMessages += assistantPrompt.replace('{text}', el.textContent);
        }}
        return chainMessages
    }

    
    
    // console.log(assistantPrompt.replace('{text}', 'Hey'))
};

// Add event listener for DOMContentLoaded and call the async function
document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);