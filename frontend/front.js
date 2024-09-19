import {
  signupUser,
  loginUser,
  logoutUser,
  getProfile,
  testSession,
  saveSession,
  loadLatestSession,
} from "./clientLogin.js";
import {
  resetInterface,
  createGoogleButtons,
  createBackButtons,
  createLoadSave,
  createLogoutContainer,
  createProfileSection,
  removeChildren,
  createSpinner,
} from "./js/authenticateUtils.js";
import { createDots, showToast } from "./js/utils.js";
import { createMessageElement } from "./js/chatUtils.js";

const dots = createDots("bot");
const dotsUser = createDots("user");
dots.style.minWidth = "90vw";
dotsUser.style.minWidth = "90vw";
// change fontsize to zoom

const zoomFactor = 4;
let fontSize = window.getComputedStyle(document.body).fontSize;
fontSize = parseInt(fontSize, 10);
// console.log("fontSize");
// console.log(fontSize);
// console.log(chatBoxContainer);
const chatBoxContainer = document.querySelector("#chat-box");
chatBoxContainer.style.fontSize = `${fontSize}px`;
// console.log("chatBoxContainer.style.fontSize");
// console.log(chatBoxContainer.style.fontSize);

const spinner = createSpinner();

const googleButtons = createGoogleButtons();
const loadSaveContainer = createLoadSave(zoomFactor, fontSize);

const chatContainer = document.querySelector("#chat-container");
chatContainer.appendChild(dotsUser);

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
  const authenticate = document.getElementById("authenticate");

  const backButtons = createBackButtons();

  const logoutContainer = createLogoutContainer();
  // check if already logged in
  const res = await getProfile();
  // remove loading screen dotsUser
  chatContainer.removeChild(dotsUser);
  //
  if (!res.ok) {
    console.log("no profile found");
    authenticate.appendChild(googleButtons);
  } else {
    // profile found
    console.log("profile found...");
    const profile = await res.json();
    console.log("profile found: ", profile);
    // create profile
    const profileSection = createProfileSection(profile);
    // remove children
    removeChildren(authenticate);
    authenticate.appendChild(profileSection);
    // // create logoutButton
    authenticate.appendChild(logoutContainer);
    // add load and save buttons
    chatBoxContainer.appendChild(loadSaveContainer);
  }

  // add copyright and privacy policy
  const footer = document.createElement("footer");

  footer.innerHTML = `
      <p>&copy; 2024 Spreed.chat. All rights reserved.</p>
      <p><a href="privacy.html" style="text-decoration: none; color: #007bff;">Privacy Policy</a></p>
  `;
  document.body.append(footer);
  //

  //
  // login/signup end
  //

  // add first message box after content is loaded
  const firstBranch = document.querySelector("#first-branch");
  const messageElement = await createMessageElement("user");
  messageElement.setAttribute("old", "no");
  firstBranch.appendChild(messageElement);
  // end of first message element
}

// Add event listener for DOMContentLoaded and call the async function
document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
