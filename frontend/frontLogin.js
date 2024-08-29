const username = document.querySelector("#username");
const password = document.querySelector("#password");
const button = document.querySelector("#login");
const googleButton = document.querySelector("#google");
const facebookButton = document.querySelector("#facebook");
googleButton.onclick = async () => {
  // const profile = await fetch("/auth/google", {
  //   method: "GET",
  // });
  // console.log(profile);
  window.location.href = "/auth/google";
  // window.location.href = "/auth/google/callback";
};

button.onclick = async () => {
  try {
    console.log("running inside js script");
    loginResp = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });
    if (loginResp.redirected) {
      console.log("redirecting to ", loginResp.url);
      window.location.href = loginResp.url;
    }
  } catch (error) {
    console.log(error);
  }
};
