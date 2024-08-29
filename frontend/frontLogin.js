const username = document.querySelector("#username");
const password = document.querySelector("#password");
const button = document.querySelector("#login");
button.onclick = async () => {
  console.log(username.value);
  console.log(password.value);

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
  const result = await loginResp.text();
  console.log(result);
};
