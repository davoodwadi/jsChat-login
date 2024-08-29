async function getUsername() {
  const loginResp = await fetch("/profileInfo", {
    method: "GET",
  });
  const loginJ = await loginResp.json();
  console.log(loginJ);
  return loginJ.username;
}

async function renderProfile() {
  const username = await getUsername();
  // console.log("username", username);
  const profile = document.querySelector("#profile");
  profile.textContent = username;
}

document.addEventListener("DOMContentLoaded", renderProfile);
