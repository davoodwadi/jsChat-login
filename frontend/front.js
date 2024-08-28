import markdownIt from 'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm'
import { getResponseServer } from "./apiModule.js";
import { mdToHTML } from './md.js';
import { signupUser, loginUser, logoutUser, getProfile, testSession, saveSession, loadLatestSession } from './clientLogin.js';

const apiUrlGPT = '/api/gpt/completions/stream' 
// const apiUrlGPT = 'https://chat.intelchain.io/api/gpt/completions/stream' 
// const apiUrlGPT = 'http://127.0.0.1:3000/api/gpt/completions/stream' 
// const decoder = new TextDecoder();


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

Let me know if you need help with anything else!`
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

const dots = createDots('bot');
const dotsUser = createDots('user');

// change fontsize to zoom
const zoomFactor = 4
const chatBoxContainer = document.querySelector('#chat-box')
let fontSize = window.getComputedStyle(document.body).fontSize
fontSize = parseInt(fontSize, 10)
console.log('fontSize')
console.log(fontSize)
console.log(chatBoxContainer)
chatBoxContainer.style.fontSize = `${fontSize}px`
console.log('chatBoxContainer.style.fontSize')
console.log(chatBoxContainer.style.fontSize)

let signupPage;
let loginPage;
let logoutContainer;
let authenticateButtons;

const gpt = true;
const max_tokens = 2000;
// test different prompts:
const systemMessageFull = `You are a helpful assistant. You respond to my questions with brief, to the point, and useful responses.`;
let idCounter = 0;

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

const removeChildren = (elem) => {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

async function saveDOM(){
    const allMessages = document.getElementById('messages')
    const profile = await getProfile()
    const saveContainer = allMessages.innerHTML
    log('*'.repeat(50))
    // const saveResp = await saveSession(profile.username, profile.password, saveContainer)
    const saveResp = await saveSession(saveContainer)
    console.log('saved session... ', saveResp)
    if (saveResp=='success'){
        showToast('success', 'Session saved successfully.')
    } else {
        showToast('failure', 'Error saving the session.')
    }
    log('*'.repeat(50))
}
async function loadDOM() {
    // get latest message
    const profile = await getProfile()
    const latestSession = await loadLatestSession() // time and saveContainer attribute
    if (!latestSession.saveContainer) {
        console.warn('No saved container found. Please save first.');
        showToast('failure', "You have to save first.")
        return; // Exit if nothing is saved to avoid issues
    }
    showToast('success', 'Loaded successfully.')
    log('*'.repeat(50))
    console.log('loading');
    const allMessages = document.getElementById('messages');
    allMessages.innerHTML = latestSession.saveContainer; // Load saved content
    console.log('loaded snapshot');
    log('*'.repeat(50))

    // Reattach event listeners
    const messageElements = allMessages.getElementsByClassName('user');
    for (const messageElement of messageElements) {
        // Clear any existing listeners (if using removeEventListener)
        messageElement.removeEventListener('keydown', handleKeydown); // Clear previous listeners
        // Reattach the listener
        messageElement.addEventListener('keydown', handleKeydown);
    }
}
function resetInterface(){
    const initialHtml = `
    <div class="branch-container">
                    <div class="branch">
                        <div id="first-message" class="editable message user" role="user" old="no" contenteditable="true" data-placeholder="New message"></div>
                    </div> 
    </div>
    `
    const allMessages = document.getElementById('messages');
    allMessages.innerHTML = initialHtml; // Load saved content
    console.log('reset interface');
    // Reattach event listeners
    const messageElements = allMessages.getElementsByClassName('user');
    for (const messageElement of messageElements) {
        // Clear any existing listeners (if using removeEventListener)
        messageElement.removeEventListener('keydown', handleKeydown); // Clear previous listeners
        // Reattach the listener
        messageElement.addEventListener('keydown', handleKeydown);
    }
}


const spinner = document.createElement('div')
spinner.classList.add('spinner')

const createLoadSave = () => {
    const loadSaveContainer = document.createElement('div')
    loadSaveContainer.classList.add('button-box')
    loadSaveContainer.id = 'loadSaveContainer'

    const loadButton = document.createElement('button')
    loadButton.id = 'loadButton'
    loadButton.textContent = 'Load'
    loadButton.onclick = async () => {
        // add spinner
        loadButton.textContent = ''
        loadButton.appendChild(spinner)
        //
        await loadDOM();
        loadButton.textContent = 'Load'
    }

    const saveButton = document.createElement('button')
    saveButton.id = 'saveButton'
    saveButton.textContent = 'Save'

    saveButton.onclick = async () => {
        // add spinner
        saveButton.textContent = ''
        saveButton.appendChild(spinner)
        //
        await saveDOM();
        saveButton.textContent = 'Save'
    }

    const resetButton = document.createElement('button')
    resetButton.id = 'resetButton'
    resetButton.textContent = 'Reset'

    resetButton.onclick = () => {
        // add spinner
        resetButton.textContent = ''
        resetButton.appendChild(spinner)
        //
        resetInterface();
        resetButton.textContent = 'Reset'
    }

    // apply only to messages
    const messageContainer = document.querySelector("#messages")
    const zoomOutButton = document.createElement('button');
    zoomOutButton.id = 'zoomOutButton'
    zoomOutButton.textContent = 'Zoom Out'
    
    zoomOutButton.addEventListener('click', () => {
        const currentFontSize = parseInt(messageContainer.style.fontSize, 10)
        console.log('currentFontSize')
        console.log(currentFontSize)
        if (currentFontSize===fontSize || Number.isNaN(currentFontSize)){ //original size
            console.log('zoomout original size: reducing by a factor of '+zoomFactor)
            messageContainer.style.fontSize = `${fontSize/zoomFactor}px`
        } else { //zommed out
            console.log('zoomed in already, resetting')
            messageContainer.style.fontSize = `${fontSize}px`
        }   
    });

    loadSaveContainer.appendChild(loadButton)
    loadSaveContainer.appendChild(saveButton)
    loadSaveContainer.appendChild(resetButton)
    loadSaveContainer.appendChild(zoomOutButton)
    return loadSaveContainer
}
const createProfileSection = (profile) => {
    let lastLogin = ''
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
        const rawDate = new Date(profile.lastLogin)
        lastLogin = rawDate.toLocaleDateString('en-US', options);
    } catch(error){
        console.log('never logged in before', error)
    }

    const profileSection = document.createElement('div');  
    profileSection.innerHTML = `
    <div class="profile-section">
        <div>
            <h2 class="profile-title">Welcome, <span id="profileUsername">${profile.username}</span></h2>
        </div>
        <div class="profile-box">
            <span class="profile-label">Last login: <span><i>${lastLogin}</i></span></span>
        </div>
    </div>
`
    profileSection.id = 'profileSection'
    profileSection.classList.add('authentication-box')
    return profileSection
}

function showToast(outcome, note) {
    // outcome: failure or success
    const toast = document.getElementById(`toast-${outcome}`);
    if (note){
        toast.textContent = note
    } else if (outcome=='success'){
         toast.textContent = 'Successful.'
    } else {
        toast.textContent = 'Failed.'
    }
    toast.className = `toast-${outcome} show`;
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000); // Duration for how long the toast is displayed
}


const chatContainer = document.querySelector('#chat-container')
chatContainer.appendChild(dotsUser)
async function handleDOMContentLoaded() {
    
    // branch-container logic:
    // branch
    //  user
    //  bot
    //  branch-container
    //      branch
    //          user
    //          bot 
    // signup/signin outside DOMLoaded
    // 
    const authenticate = document.getElementById('authenticate')

    authenticateButtons = document.createElement('div')
    authenticateButtons.id = 'authenticateButtons'
    authenticateButtons.classList.add('button-box')

    const signupButton = document.createElement('button')
    signupButton.id = 'signupButton'
    signupButton.textContent = 'Signup'
    const loginButton = document.createElement('button')
    loginButton.id = 'loginButton'
    loginButton.textContent = 'Login'
    authenticateButtons.appendChild(signupButton)
    authenticateButtons.appendChild(loginButton)


    signupPage = createSignupPage()
    loginPage = createLoginPage()
    logoutContainer = createLogoutContainer()
    // check if already logged in
    const profile = await getProfile()
    // remove loading screen dotsUser
    chatContainer.removeChild(dotsUser)
    //
    if (!profile){
        console.log('no profile found')
        authenticate.appendChild(authenticateButtons)
    } else{
        // profile found
        // create profile
        const profileSection = createProfileSection(profile)
        // remove children
        removeChildren(authenticate)
        authenticate.appendChild(profileSection)
        // // create logoutButton
        authenticate.appendChild(logoutContainer)
        const logoutButton = document.querySelector('#logoutButton')
        logoutButton.onclick = logoutButtonClick

        // add load and save buttons
        const chatBoxContainer = document.querySelector('#chat-box')
        const loadSaveContainer = createLoadSave()
        chatBoxContainer.appendChild(loadSaveContainer)
    }
    
    //
    const inlineLoginButton = document.createElement('button')
    inlineLoginButton.textContent = 'Login instead'
    inlineLoginButton.id = 'instead'
    inlineLoginButton.onclick = () => {
        loginButton.onclick()
    }
    const inlineSignupButton = document.createElement('button')
    inlineSignupButton.textContent = 'Signup instead'
    inlineSignupButton.id = 'instead'
    inlineSignupButton.onclick = () => {
        signupButton.onclick()
    }


    signupButton.onclick = () => {
        removeChildren(authenticate)
        
        authenticate.appendChild(signupPage)
        
        //
        const signupButtonSubmit = document.getElementById('signupButtonSubmit')
        signupButtonSubmit.onclick = async () => {
            // add spinner
            signupButtonSubmit.textContent = ''
            signupButtonSubmit.appendChild(spinner)
            //
            // remove notes
            removeNotes();
            //
            const signUsername = document.getElementById('signUsername').value.toLowerCase()
            const signPassword = document.getElementById('signPassword').value.toLowerCase()
            // log(signUsername)
            // log(signPassword)
            const res = await signupUser(signUsername, signPassword)
            // console.log(res)
            if (res.includes('the username already exists.')){
                const failureNote = document.createElement('div')
                failureNote.classList.add('failure-note')
                failureNote.textContent = 'Username already exists'

                signupPage.appendChild(failureNote)
                const insteadExists = authenticate.querySelector('#instead')
                console.log('insteadExists')
                console.log(insteadExists)
                if (!insteadExists){
                    signupPage.appendChild(inlineLoginButton)
                }

            } else { // signup successful
                const successNote = document.createElement('div')
                successNote.classList.add('success-note')
                successNote.textContent = 'Signed up. Redirecting.'
                
                signupPage.appendChild(successNote)
                
                // login automatically
                const loginRes = await loginUser(signUsername, signPassword)

                const profile = await getProfile()
                // redirect
                // create profile
                const profileSection = createProfileSection(profile)
                // remove children
                removeChildren(authenticate)
                authenticate.appendChild(profileSection)
                // // create logoutButton
                authenticate.appendChild(logoutContainer)
                // remove signupPage.appendChild(successNote)
                signupPage.removeChild(successNote)
                //
                const logoutButton = document.querySelector('#logoutButton')
                logoutButton.onclick = logoutButtonClick
                // add load save 
                const chatBoxContainer = document.querySelector('#chat-box')
                const loadSaveContainer = createLoadSave()
                chatBoxContainer.appendChild(loadSaveContainer)
            }
            // remove spinner
            signupButtonSubmit.textContent = 'Signup'
            //
        }
    }
    loginButton.onclick = () => {
        removeChildren(authenticate)
        
        authenticate.append(loginPage)
        const loginButtonSubmit = document.getElementById('loginButtonSubmit')
        
        loginButtonSubmit.onclick = async () => {
            // add spinner
            loginButtonSubmit.textContent = ''
            loginButtonSubmit.appendChild(spinner)

            // remove notes
            removeNotes();
            //

            const logUsername = document.getElementById('logUsername').value.toLowerCase()
            const logPassword = document.getElementById('logPassword').value.toLowerCase()
            // log(logUsername)
            // log(logPassword)
            const loginRes = await loginUser(logUsername, logPassword)
                            

            console.log(loginRes)
            if (loginRes.includes('Correct')){ // login successful
                const successNote = document.createElement('div')
                successNote.classList.add('success-note')
                successNote.textContent = 'Logged in. Redirecting.'
                loginPage.appendChild(successNote)
                // store session id
                const profile = await getProfile()

                // reset loginbuttonsubmit
                loginButtonSubmit.textContent = 'Login'
                
                // redirect
                // create profile
                const profileSection = createProfileSection(profile)
                // remove children
                removeChildren(authenticate)
                authenticate.appendChild(profileSection)
                // // create logoutButton
                authenticate.appendChild(logoutContainer)
                // remove successNote
                loginPage = createLoginPage()
                //
                const logoutButton = document.querySelector('#logoutButton')
                logoutButton.onclick = logoutButtonClick
                // add load save buttons
                const chatBoxContainer = document.querySelector('#chat-box')
                const loadSaveContainer = createLoadSave()
                chatBoxContainer.appendChild(loadSaveContainer)

                // remove spinner
                loginButtonSubmit.textContent = 'Login'
                //  
            } else { // login failed
                if (loginRes.includes('Not allowed')){ // wrong pass
                    const failureNote = document.createElement('div')
                    failureNote.classList.add('failure-note')
                    failureNote.textContent = 'Password is incorrect.'
                    loginPage.appendChild(failureNote)
                } else if (loginRes.includes('User not found.')) { // no user
                    const failureNote = document.createElement('div')
                    failureNote.classList.add('failure-note')
                    failureNote.textContent = 'Username not found.'
                    loginPage.appendChild(failureNote)
                }

                // reset loginbuttonsubmit
                loginButtonSubmit.textContent = 'Login'

                const insteadExists = authenticate.querySelector('#instead')
                if (!insteadExists){
                    loginPage.appendChild(inlineSignupButton)
            }} 
            
    }}
    // login/signup end
    //           

    // add first message box after content is loaded
    const firstBranch = document.querySelector('#first-branch')
    const messageElement = await createMessageElement('user')
    messageElement.setAttribute('old', 'no')
    firstBranch.appendChild(messageElement)
    // end of first message element

    // chatBoxContainer.addEventListener('click', function() {
        // if (parseInt(this.style.fontSize, 10)===fontSize){ //original size
        //     this.style.fontSize = `${fontSize/zoomFactor}px`
        // } else { //zommed out
        //     this.style.fontSize = `${fontSize}px`
        // }   
    // });
    // zoom end //

};

// Add event listener for DOMContentLoaded and call the async function
document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);

async function logoutButtonClick() {
    // add spinner
    logoutButton.textContent = ''
    logoutButton.appendChild(spinner)
    //
    const resp = await logoutUser()
    logoutButton.textContent = 'Logout'
    // reset interface
    resetInterface();
    //
    // reset signupPage
    signupPage = createSignupPage()
    loginPage = createLoginPage()
    //
    removeChildren(authenticate)
    authenticate.appendChild(authenticateButtons)
    // if loadSaveContainer remove it
    const loadSaveContainer = document.querySelector('#loadSaveContainer')
    if (loadSaveContainer){
        const chatBoxContainer = document.querySelector('#chat-box')
        chatBoxContainer.removeChild(loadSaveContainer)
    }
}

function removeNotes(){
    const allSuccessNoteElements = document.getElementsByClassName('success-note')
    for (const el of allSuccessNoteElements){
        el.parentElement.removeChild(el)
    }
    const allFailureNoteElements = document.getElementsByClassName('failure-note')
    for (const el of allFailureNoteElements){
        el.parentElement.removeChild(el)
}}

function createSignupPage(){
    const signupPage = document.createElement('div')
    signupPage.innerHTML = `
                <div class="auth-box">
                    <input type="text" id="signUsername" class="input-text" placeholder="Username" />
                    <input type="password" id="signPassword" class="input-text" placeholder="Password" />
                </div>
                <div class="button-box">
                    <button id="signupButtonSubmit">Signup</button>
                </div>
    `
    signupPage.id = 'signupPage'
    signupPage.classList.add('authentication-box')
    return signupPage
}
function createLoginPage(){
    const loginPage = document.createElement('div')
    loginPage.innerHTML = `
                <div class="auth-box">
                    <input type="text" id="logUsername" class="input-text" placeholder="Username" />
                    <input type="password" id="logPassword" class="input-text" placeholder="Password" />
                </div>
                <div class="button-box">
                    <button id="loginButtonSubmit">Login</button>
                </div>
    `
    loginPage.id = 'loginPage'
    loginPage.classList.add('authentication-box')
    return loginPage
}

function createLogoutContainer(){
    const logoutContainer = document.createElement('div')
    logoutContainer.innerHTML = `
    <button id="logoutButton">Logout</button>
    `
    logoutContainer.id = 'logoutContainer'
    logoutContainer.classList.add('button-box')
    return logoutContainer
}
async function logEvent(event){
    let target = event.target
    let branch = target.parentElement
    let branchContainer = branch.parentElement
    let elementToFocus
    let messageElement
    
    // const oldContent = target.oldContent
    const oldContent = target.getAttribute('oldContent')
    log('oldContent')
    log(oldContent)

    if ((target.getAttribute('old')==='yes') && target.role==='user'){//old and user
        log('old message')
        // add new branch
        branch = document.createElement('div')
        branch.classList.add('branch')
        branchContainer.appendChild(branch)
        // add modified target
        messageElement = await createMessageElement('user');
        messageElement.textContent = target.textContent;
        // messageElement.oldContent = messageElement.textContent
        messageElement.setAttribute('oldContent', messageElement.textContent) 
        messageElement.setAttribute('old', 'yes')
        // messageElement.triggeredBefore = true;
        branch.appendChild(messageElement);
        // set element to focus to
        elementToFocus = messageElement;
        elementToFocus.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
        // set the old content
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
            // console.log(messages)

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
        messageElement.setAttribute('old', 'no')
        newBranch.appendChild(messageElement);

        
    } else if ( target.role==='user') { // latest and user
        log('new message')
        
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
            // console.log(messages)

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
        messageElement.setAttribute('old', 'no')
        newBranch.appendChild(messageElement);

    }
    // target.triggeredBefore = true
    target.setAttribute('old', 'yes')
    
    if(elementToFocus.role==='bot'){
        elementToFocus.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
    } else {
        elementToFocus.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
    }

};
// Function to handle keydown events
function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent the default behavior of adding a new line
        logEvent(event); // Assuming this function exists to log events
        log('event.target.textContent')
        log(event.target.textContent)
        event.target.setAttribute('oldContent', event.target.textContent); // Store old content
        event.target.blur(); // Lose focus
    }
}

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
            
            messageElement.textContent = '' 
            messageElement.oldOutput = undefined
            messageElement.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
            messageElement.text = ''
            
            // try to set max-width: 95vw;
            messageElement.style.maxWidth= '95vw';
            console.log('got stream response => reading it chunk by chunk.')
            try {
                // const textDecoded  = await getDummyMessage()
                // mdToHTML(textDecoded, messageElement);
                branch.replaceChild(messageElement, dots)
                const reader = res.body.getReader();
                let result;
                let refreshCounter = 0
                while (!(result = await reader.read()).done) {      
                    // replace dots
                    if (branch.contains(dots)){
                        branch.replaceChild(messageElement, dots)
                    } 
                    const chunk = result.value; // This is a Uint8Array   
                    const textDecoded = new TextDecoder("utf-8").decode(chunk); // Decode chunk to text
                    messageElement.text = messageElement.text + textDecoded;

                    mdToHTML(messageElement.text, messageElement);
                    if (refreshCounter%3===0){
                        messageElement.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'center'})
                    }
                    refreshCounter++
                }
                reader.releaseLock();
            }
            catch (error) {
                console.error('Error reading stream:', error)
            } finally{
                // reset max-width for the parents only
                // messageElement.style.maxWidth= '';
                setAttributeForMessageParents(messageElement)
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
        messageElement.contentEditable = true;
        messageElement.setAttribute('data-placeholder', 'New message')
        // event listener
        messageElement.addEventListener('keydown', handleKeydown);
        //
    }
    messageElement.role = role;
    messageElement.name = `${messageElement.role}-${idCounter}`
    messageElement.counter = idCounter;
    idCounter++
    
    return messageElement
}


async function getDummyMessage() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(bot_default_message);
        }, 1000); // 0.5 second delay
    });
}

function createDots(role){
    const dots = document.createElement('div');
    dots.classList.add('message', role, 'dots-message');
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
        
        addMessageElementToArrayReverse(element, messageElementArray);
        element = element.parentElement;
    }
    messageElementArray = messageElementArray.reverse()
    // each element from top to bottom
    
    return messageElementArray
}

function setAttributeForMessageParentsInner(el){
    for (let i = el.children.length - 1; i >= 0; i--) {
        const child = el.children[i];
        if (child.classList.contains('message') && (!child.classList.contains('dots-message'))){
            console.log('*'.repeat(50))
            console.log('before attribute set for: ', child)
            child.style.maxWidth = ''
            console.log('after set for: ', child)
            console.log('width: ', window.getComputedStyle(el).width)
            console.log('*'.repeat(50))
        }
        
}};
function setAttributeForMessageParents(thisElement){
    let element = thisElement.parentElement.parentElement;
    while (element.id!=="chat-container"){
        setAttributeForMessageParentsInner(element);
        element = element.parentElement;
}}



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
            
            chainMessages += userTemplateNoTicks.replace('{text}', el.textContent);
        } else {
            
            chainMessages += assistantPrompt.replace('{text}', el.textContent);
    }}
    return chainMessages
}
