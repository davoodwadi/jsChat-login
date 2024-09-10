import markdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm";
import { getResponseServer } from "../apiModule.js";
import { mdToHTML } from "../md.js";
import {
  createDots,
  setAttributeForMessageParents,
  showToast,
} from "./utils.js";
import { getProfile } from "../clientLogin.js";
const production = true;
const apiUrlGPT = "/api/gpt/completions/stream";
// const apiUrlGPT = 'https://chat.intelchain.io/api/gpt/completions/stream'
// const apiUrlGPT = 'http://127.0.0.1:3000/api/gpt/completions/stream'
// const decoder = new TextDecoder();

const gpt = true;
const max_tokens = 2000;
// test different prompts:
const systemMessageFull = `You are a helpful assistant. You respond to my questions with brief, to the point, and useful responses.`;

let idCounter = 0;
const dots = createDots("bot");
const dotsUser = createDots("user");

const md = markdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (__) {}
    }

    return (
      '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
    );
  },
});

// Function to handle Enter keydown events
export function handleKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent the default behavior of adding a new line
    logEvent(event); // Assuming this function exists to log events
    // console.log("event.target.textContent");
    // console.log(event.target.textContent);
    event.target.setAttribute("oldContent", event.target.textContent); // Store old content
    event.target.blur(); // Lose focus
  }
}
export async function logEvent(event) {
  let target = event.target;
  let branch = target.parentElement;
  let branchContainer = branch.parentElement;
  let elementToFocus;
  let messageElement;

  // const oldContent = target.oldContent
  const oldContent = target.getAttribute("oldContent");
  console.log("oldContent");
  console.log(oldContent);

  if (target.getAttribute("old") === "yes" && target.role === "user") {
    //old and user
    console.log("old message");
    // add new branch
    branch = document.createElement("div");
    branch.classList.add("branch");
    branchContainer.appendChild(branch);
    // add modified target
    messageElement = await createMessageElement("user");
    messageElement.textContent = target.textContent;
    // messageElement.oldContent = messageElement.textContent
    messageElement.setAttribute("oldContent", messageElement.textContent);
    messageElement.setAttribute("old", "yes");
    // messageElement.triggeredBefore = true;
    branch.appendChild(messageElement);
    // set element to focus to
    elementToFocus = messageElement;
    elementToFocus.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "center",
    });
    // set the old content
    target.textContent = oldContent;

    // add dots
    branch.appendChild(dots);

    // get llm messages
    const elementArray = createElementArray(messageElement);

    if (gpt) {
      let messages = createMessageChainGPT(elementArray);
      console.log(JSON.stringify(messages));
      messageElement = await createMessageElement("bot", messages, branch);
    } else {
      let messages = createMessageChain(elementArray);
      messages += assistantTag;
      // console.log(messages)

      // add bot and empty user
      messageElement = await createMessageElement("bot", messages);
      branch.replaceChild(messageElement, dots);
    }

    // create branch-container within branch.
    let newBranchContainer = document.createElement("div");
    newBranchContainer.classList.add("branch-container");
    branch.appendChild(newBranchContainer);
    // create branch within newcontainer
    let newBranch = document.createElement("div");
    newBranch.classList.add("branch");
    newBranchContainer.appendChild(newBranch);

    messageElement = await createMessageElement("user");
    messageElement.setAttribute("old", "no");
    newBranch.appendChild(messageElement);
  } else if (target.role === "user") {
    // latest and user
    console.log("new message");

    // add branch
    // branch = document.createElement('div')
    // branch.classList.add('branch')
    // branchContainer.appendChild(branch)
    //
    // branch.appendChild(target)
    // add dots to the branch
    branch.appendChild(dots);

    // check to see if logged in
    const res = await getProfile();
    console.log("res", res);
    if (!res.ok && production) {
      const googleButton = document.getElementById("googleButton");
      googleButton.classList.add("glow-green");
      googleButton.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "center",
      });
      //   setTimeout(() => {
      //     googleButton.classList.remove("glow-green");
      //   }, 1000);
      dots.remove();
      showToast("failure", "Please log in.");
      return;
    }
    //

    // get llm messages
    const elementArray = createElementArray(target);

    if (gpt) {
      let messages = createMessageChainGPT(elementArray);
      console.log(JSON.stringify(messages));
      messageElement = await createMessageElement("bot", messages, branch);
      //
      // get and show the updated profile
      const res = await getProfile();
      if (res.ok) {
        const profile = await res.json();
        const tokensRemaining = document.querySelector("#tokensRemaining");
        console.log(profile);
        console.log(tokensRemaining);
        tokensRemaining.textContent =
          profile.tokensRemaining.toLocaleString("en-US");
      }
      //
    } else {
      let messages = createMessageChain(elementArray);
      messages += assistantTag;
      // console.log(messages)

      // add bot message and followup user message
      messageElement = await createMessageElement("bot");
      branch.replaceChild(messageElement, dots);
    }

    // set element to focus to
    elementToFocus = messageElement;

    // create branch-container within branch.
    let newBranchContainer = document.createElement("div");
    newBranchContainer.classList.add("branch-container");
    branch.appendChild(newBranchContainer);
    // create branch within newcontainer
    let newBranch = document.createElement("div");
    newBranch.classList.add("branch");
    newBranchContainer.appendChild(newBranch);

    messageElement = await createMessageElement("user");
    messageElement.setAttribute("old", "no");
    newBranch.appendChild(messageElement);
  }
  // target.triggeredBefore = true
  target.setAttribute("old", "yes");

  if (elementToFocus.role === "bot") {
    elementToFocus.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "center",
    });
  } else {
    elementToFocus.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "center",
    });
  }
}

export async function createMessageElement(role, pretext, branch) {
  let messageElement = document.createElement("div");
  if (role === "bot") {
    messageElement.classList.add("editable", "message", role);
    messageElement.contentEditable = true;
    // messageElement.textContent = pretext + '\n\n' + (await getDummyMessage())
    if (gpt) {
      // let textDecoded = ''
      console.log(`await fetch(apiUrlGPT`);
      const res = await fetch(apiUrlGPT, {
        method: "POST",
        body: JSON.stringify({
          messages: pretext,
          max_tokens: max_tokens,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const apiError = await res.text();
        console.error(
          "API call failed with status: ",
          res.status,
          " ",
          apiError
        );
        // call noTokensLeft function
        noTokensLeft();
        return; // Handle the error accordingly
      }

      messageElement.textContent = "";
      messageElement.oldOutput = undefined;
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "center",
      });
      messageElement.text = "";

      // try to set max-width: 95vw;
      messageElement.style.maxWidth = "95vw";
      console.log("got stream response => reading it chunk by chunk.");
      try {
        // const textDecoded  = await getDummyMessage()
        // mdToHTML(textDecoded, messageElement);
        branch.replaceChild(messageElement, dots);
        const reader = res.body.getReader();
        let result;
        let refreshCounter = 0;
        while (!(result = await reader.read()).done) {
          // replace dots
          if (branch.contains(dots)) {
            branch.replaceChild(messageElement, dots);
          }
          const chunk = result.value; // This is a Uint8Array
          const textDecoded = new TextDecoder("utf-8").decode(chunk); // Decode chunk to text
          messageElement.text = messageElement.text + textDecoded;

          mdToHTML(messageElement.text, messageElement);
          if (refreshCounter % 3 === 0) {
            messageElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "center",
            });
          }
          refreshCounter++;
        }
        reader.releaseLock();
      } catch (error) {
        console.error("Error reading stream:", error);
      } finally {
        // reset max-width for the parents only
        // messageElement.style.maxWidth= '';
        setAttributeForMessageParents(messageElement);
      }
    } else {
      const llmResponse = await getResponseServer(pretext);
      console.log(llmResponse);
      mdToHTML(llmResponse, messageElement);
    }

    // parse llmResponse from md to html
    // const html = md.render(llmResponse);
    // const cleanHTML = DOMPurify.sanitize(html);
    // log(cleanHTML)
    // //
    // messageElement.innerHTML = cleanHTML
  } else {
    messageElement.classList.add("editable", "message", role);
    messageElement.contentEditable = true;
    messageElement.setAttribute("data-placeholder", "New message");
    // event listener
    messageElement.addEventListener("keydown", handleKeydown);
    //
  }
  messageElement.role = role;
  messageElement.name = `${messageElement.role}-${idCounter}`;
  messageElement.counter = idCounter;
  idCounter++;

  return messageElement;
}
export function noTokensLeft() {
  console.log("noTokensLeft");

  // showToast
  showToast("failure", "Not enough tokens. Subscribe to the Pro plan.");
  const elementToFocus = document.getElementById("profileSection");
  elementToFocus.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "center",
  });

  // remove dots
  dots.remove();
}
async function getDummyMessage() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(bot_default_message);
    }, 1000); // 0.5 second delay
  });
}

function addMessageElementToArrayReverse(el, messageElementArray) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i];
    if (
      child.classList.contains("message") &&
      !child.classList.contains("dots-message")
    ) {
      messageElementArray.push(child);
    }
  }
}

function createElementArray(lastElement) {
  let messageElementArray = [];
  let element = lastElement;
  while (element.id !== "chat-container") {
    addMessageElementToArrayReverse(element, messageElementArray);
    element = element.parentElement;
  }
  messageElementArray = messageElementArray.reverse();
  // each element from top to bottom

  return messageElementArray;
}

// create message from chain elements
function createMessageChainGPT(messageElementArray) {
  // let chainMessages = systemPrompt
  // let chainMessages = [
  //   {
  //     role: "system",
  //     content: systemMessageFull,
  //   },
  // ];
  let chainMessages = []; // no system message
  for (let el of messageElementArray) {
    if (el.classList.contains("user")) {
      chainMessages.push({
        role: "user",
        content: el.textContent,
      });
    } else {
      chainMessages.push({
        role: "assistant",
        content: el.textContent,
      });
    }
  }
  return chainMessages;
}
function createMessageChain(messageElementArray) {
  // let chainMessages = systemPrompt
  let chainMessages = "";
  for (let el of messageElementArray) {
    if (el.classList.contains("user")) {
      chainMessages += userTemplateNoTicks.replace("{text}", el.textContent);
    } else {
      chainMessages += assistantPrompt.replace("{text}", el.textContent);
    }
  }
  return chainMessages;
}
