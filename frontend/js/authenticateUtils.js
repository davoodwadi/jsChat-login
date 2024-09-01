import {
  signupUser,
  loginUser,
  logoutUser,
  getProfile,
  testSession,
  saveSession,
  loadLatestSession,
} from "../clientLogin.js";
import { handleKeydown } from "./chatUtils.js";
import { showToast } from "./utils.js";

export const removeChildren = (elem) => {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
};

async function saveDOM() {
  const allMessages = document.getElementById("messages");
  const saveContainer = allMessages.innerHTML;
  console.log("*".repeat(50));
  // const saveResp = await saveSession(profile.username, profile.password, saveContainer)
  const saveResp = await saveSession(saveContainer);
  console.log("saved session... ", saveResp);
  if (saveResp == "success") {
    showToast("success", "Session saved successfully.");
  } else {
    showToast("failure", "Error saving the session.");
  }
  console.log("*".repeat(50));
}
async function loadDOM() {
  // get latest message
  const latestSession = await loadLatestSession(); // time and saveContainer attribute
  if (!latestSession.saveContainer) {
    console.warn("No saved container found. Please save first.");
    showToast("failure", "You have to save first.");
    return; // Exit if nothing is saved to avoid issues
  }
  showToast("success", "Loaded successfully.");
  console.log("*".repeat(50));
  console.log("loading");
  const allMessages = document.getElementById("messages");
  allMessages.innerHTML = latestSession.saveContainer; // Load saved content
  console.log("loaded snapshot");
  console.log("*".repeat(50));

  // Reattach event listeners
  const messageElements = allMessages.getElementsByClassName("user");
  for (const messageElement of messageElements) {
    // Clear any existing listeners (if using removeEventListener)
    messageElement.removeEventListener("keydown", handleKeydown); // Clear previous listeners
    // Reattach the listener
    messageElement.addEventListener("keydown", handleKeydown);
  }
}

export function createGoogleButtons() {
  const googleButtons = document.createElement("div");
  googleButtons.id = "googleButtons";
  googleButtons.classList.add("button-box");
  const googleButton = document.createElement("button");
  googleButton.id = "googleButton";
  googleButton.className = "google-button";
  googleButton.innerHTML = `
      <i id="googleIcon" class="fa-brands fa-google"></i>
      Continue with Google
      `;

  googleButton.onclick = async () => {
    const googleIcon = googleButton.querySelector("#googleIcon");
    googleIcon.classList.add("google-spinner");
    window.location.href = "/auth/google";
  };
  googleButtons.appendChild(googleButton);
  return googleButtons;
}
export function createLogoutContainer() {
  const logoutContainer = document.createElement("div");
  logoutContainer.innerHTML = `
      <button id="logoutButton">Logout</button>
      `;
  const logoutButton = logoutContainer.querySelector("#logoutButton");
  logoutButton.onclick = logoutButtonClick;
  logoutContainer.id = "logoutContainer";
  logoutContainer.classList.add("button-box");
  return logoutContainer;
}
export async function logoutButtonClick() {
  // add spinner
  const spinner = createSpinner();
  // create googlebuttons
  const googleButtons = createGoogleButtons();

  logoutButton.textContent = "";
  logoutButton.appendChild(spinner);
  //
  const resp = await logoutUser();
  logoutButton.textContent = "Logout";
  // reset interface
  resetInterface();
  //
  removeChildren(authenticate);
  authenticate.appendChild(googleButtons);
  // if loadSaveContainer remove it
  const loadSaveContainer = document.querySelector("#loadSaveContainer");
  if (loadSaveContainer) {
    const chatBoxContainer = document.querySelector("#chat-box");
    chatBoxContainer.removeChild(loadSaveContainer);
  }
}

export const createLoadSave = (zoomFactor, fontSize) => {
  const loadSaveContainer = document.createElement("div");
  loadSaveContainer.classList.add("button-box");
  loadSaveContainer.id = "loadSaveContainer";

  const loadButton = document.createElement("button");
  loadButton.id = "loadButton";
  loadButton.textContent = "Load";
  loadButton.onclick = async () => {
    // add spinner
    loadButton.textContent = "";
    const spinner = createSpinner();
    loadButton.appendChild(spinner);
    //
    await loadDOM();
    loadButton.textContent = "Load";
  };

  const saveButton = document.createElement("button");
  saveButton.id = "saveButton";
  saveButton.textContent = "Save";

  saveButton.onclick = async () => {
    // add spinner
    saveButton.textContent = "";
    const spinner = createSpinner();
    saveButton.appendChild(spinner);
    //
    await saveDOM();
    saveButton.textContent = "Save";
  };

  const resetButton = document.createElement("button");
  resetButton.id = "resetButton";
  resetButton.textContent = "Reset";

  resetButton.onclick = () => {
    // add spinner
    resetButton.textContent = "";
    const spinner = createSpinner();
    resetButton.appendChild(spinner);
    //
    resetInterface();
    resetButton.textContent = "Reset";
  };

  // apply only to messages
  const messageContainer = document.querySelector("#messages");
  const zoomOutButton = document.createElement("button");
  zoomOutButton.id = "zoomOutButton";
  zoomOutButton.textContent = "Zoom Out";

  zoomOutButton.addEventListener("click", () => {
    const currentFontSize = parseInt(messageContainer.style.fontSize, 10);
    console.log("currentFontSize");
    console.log(currentFontSize);
    if (currentFontSize === fontSize || Number.isNaN(currentFontSize)) {
      //original size
      console.log(
        "zoomout original size: reducing by a factor of " + zoomFactor
      );
      messageContainer.style.fontSize = `${fontSize / zoomFactor}px`;
      // change text to zoomin
      zoomOutButton.textContent = "Zoom In";
    } else {
      //zommed out
      console.log("zoomed in already, resetting");
      messageContainer.style.fontSize = `${fontSize}px`;
      // change text to zoomout
      zoomOutButton.textContent = "Zoom Out";
    }
  });

  loadSaveContainer.appendChild(loadButton);
  loadSaveContainer.appendChild(saveButton);
  loadSaveContainer.appendChild(resetButton);
  loadSaveContainer.appendChild(zoomOutButton);
  return loadSaveContainer;
};

export const createProfileSection = (profile) => {
  let lastLogin = "";
  let quotaRefreshedAt;
  try {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };
    let rawDate = new Date(profile.lastLogin);
    lastLogin = rawDate.toLocaleDateString("en-US", options);
    rawDate = new Date(profile.quotaRefreshedAt);
    quotaRefreshedAt = rawDate.toLocaleDateString("en-US", options);
  } catch (error) {
    console.log("never logged in before", error);
  }
  const formattedTokens = profile.tokensRemaining.toLocaleString("en-US");
  const profileSection = document.createElement("div");
  profileSection.innerHTML = `
      <div class="profile-section">
          <div>
              <h1 class="profile-title">Welcome, <span id="profileUsername">${
                profile.displayName ? profile.displayName : profile.username
              }</span></h1>
          </div>
          <div class="profile-box">
              <p class="profile-label">Tokens remaining: <span><i id="tokensRemaining">${formattedTokens}</i></span></p>
          </div>
          <div class="profile-box">
              <span class="profile-label">Quota refreshed at <span><i id="quotaRefreshedAt">${quotaRefreshedAt}</i></span></span>
          </div>
      </div>
  `;
  profileSection.id = "profileSection";
  profileSection.classList.add("authentication-box");
  return profileSection;
};

export function createBackButtons() {
  // create googlebuttons
  const googleButtons = createGoogleButtons();
  const backButtons = document.createElement("div");
  backButtons.classList.add("back-button-container");
  const backButton = document.createElement("button");
  backButtons.appendChild(backButton);
  backButton.classList.add("back-button");
  backButton.id = "backButton";
  backButton.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Back`;
  backButton.onclick = () => {
    removeChildren(authenticate);
    authenticate.appendChild(googleButtons);
  };
  return backButtons;
}

function createSignupPage() {
  const signupPage = document.createElement("div");
  signupPage.innerHTML = `
                <form id="signupForm"">
                  <div class="auth-box">
                      <input type="text" id="signFirstName" class="input-text" required placeholder="First name" />
                      <div class="error-message" id="firstNameError"></div>
                      <input type="text" id="signLastName" class="input-text" required placeholder="Last name" />
                      <div class="error-message" id="lastNameError"></div>
                  </div>
                  <div class="auth-box">
                      <input type="email" id="signEmail" class="input-text" required placeholder="Email" />
                      <div class="error-message" id="emailError"></div>
                      <label for="signPassword">Password:</label>
                      <input type="password" id="signPassword" class="input-text" required placeholder="Password" />
                      
                  </div>
                  <div class="button-box">
                      <button id="signupButtonSubmit">Signup</button>
                  </div>
                </form>
      `;
  signupPage.id = "signupPage";
  signupPage.classList.add("authentication-box");

  return signupPage;
}
function createLoginPage() {
  const loginPage = document.createElement("div");
  loginPage.innerHTML = `
                  <div class="auth-box">
                      <input type="text" id="logUsername" class="input-text" placeholder="Username" />
                      <input type="password" id="logPassword" class="input-text" placeholder="Password" />
                  </div>
                  <div class="button-box">
                      <button id="loginButtonSubmit">Login</button>
                  </div>
      `;
  loginPage.id = "loginPage";
  loginPage.classList.add("authentication-box");
  return loginPage;
}

function createAuthenticatePage() {
  authenticateButtons = document.createElement("div");
  authenticateButtons.id = "authenticateButtons";
  authenticateButtons.classList.add("button-box");

  const signupButton = document.createElement("button");
  signupButton.id = "signupButton";
  signupButton.textContent = "Signup";
  const loginButton = document.createElement("button");
  loginButton.id = "loginButton";
  loginButton.textContent = "Login";

  authenticateButtons.appendChild(signupButton);
  authenticateButtons.appendChild(loginButton);

  signupPage = createSignupPage();
  loginPage = createLoginPage();
}

export function resetInterface() {
  const initialHtml = `
      <div class="branch-container">
                      <div class="branch">
                          <div id="first-message" class="editable message user" role="user" old="no" contenteditable="true" data-placeholder="New message"></div>
                      </div> 
      </div>
      `;
  const allMessages = document.getElementById("messages");
  allMessages.innerHTML = initialHtml; // Load saved content
  console.log("reset interface");
  // Reattach event listeners
  const messageElements = allMessages.getElementsByClassName("user");
  for (const messageElement of messageElements) {
    // Clear any existing listeners (if using removeEventListener)
    messageElement.removeEventListener("keydown", handleKeydown); // Clear previous listeners
    // Reattach the listener
    messageElement.addEventListener("keydown", handleKeydown);
  }
}

function removeNotes() {
  const allSuccessNoteElements =
    document.getElementsByClassName("success-note");
  for (const el of allSuccessNoteElements) {
    el.parentElement.removeChild(el);
  }
  const allFailureNoteElements =
    document.getElementsByClassName("failure-note");
  for (const el of allFailureNoteElements) {
    el.parentElement.removeChild(el);
  }
}

export function createSpinner() {
  const spinner = document.createElement("div");
  spinner.classList.add("spinner");
  return spinner;
}
