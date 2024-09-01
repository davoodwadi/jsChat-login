// const urlBase = 'https://chat.intelchain.io'
// const urlBase = 'http://127.0.0.1:3000'
const loginUrl = "/users";

export async function signupUser(username, password) {
  const res = await fetch(loginUrl + "/signup", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    const responseData = await res.text();
    return responseData;
  } else {
    console.error("Error:", res.status, res.statusText);
  }
}

export async function loginUser(username, password) {
  const res = await fetch(loginUrl + "/login", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    console.log("logged in successfully");
    const responseData = await res.json();
    console.log("logged in: ", responseData.username);
    return responseData;
  } else {
    const responseData = await res.text();
    console.log("bad user", responseData);
    console.error("Error:", res.status, res.statusText);
    return { username: null, status: responseData };
  }
}

export async function getProfile() {
  const res = await fetch(loginUrl + "/profile", {
    method: "GET",
  });
  return res;
}

export async function logoutUser() {
  const res = await fetch(loginUrl + "/logout", {
    method: "GET",
  });
  if (res.ok) {
    const responseData = await res.text();
    return responseData;
  } else {
    console.log("Error:", res.status, res.statusText);
    return null;
  }
}

export async function testSession() {
  const res = await fetch("/test-session", {
    method: "GET",
  });
  if (res.ok) {
    const responseData = await res.json();

    return responseData;
  } else {
    console.error("Error:", res.status, res.statusText);
  }
}

export async function saveSession(saveContainer) {
  const res = await fetch(loginUrl + "/save", {
    method: "POST",
    body: JSON.stringify({
      saveContainer: saveContainer,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    const responseData = await res.json();

    return responseData;
  } else {
    console.error("Error:", res.status, res.statusText);
  }
}

export async function loadLatestSession() {
  const res = await fetch(loginUrl + "/load", {
    method: "GET",
  });
  console.log(res.status); // 200 for success, 404 for 'not found'
  if (res.ok) {
    const responseData = await res.json();

    return responseData;
  } else {
    console.error("Error:", res.status, res.statusText);
  }
}
