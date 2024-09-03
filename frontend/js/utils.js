function setAttributeForMessageParentsInner(el) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i];
    if (
      child.classList.contains("message") &&
      !child.classList.contains("dots-message")
    ) {
      console.log("*".repeat(50));
      console.log("before attribute set for: ", child);
      child.style.maxWidth = "";
      console.log("after set for: ", child);
      console.log("width: ", window.getComputedStyle(el).width);
      console.log("*".repeat(50));
    }
  }
}
export function setAttributeForMessageParents(thisElement) {
  let element = thisElement.parentElement.parentElement;
  while (element.id !== "chat-container") {
    setAttributeForMessageParentsInner(element);
    element = element.parentElement;
  }
}

export function showToast(outcome, note, duration) {
  // outcome: failure or success
  // <div id="toast-success" class="toast-success">Save successful!</div>
  const toast = document.createElement("div");
  toast.id = `toast-${outcome}`;
  toast.classList.add(`toast-${outcome}`);
  if (note) {
    toast.textContent = note;
  } else if (outcome == "success") {
    toast.textContent = "Successful.";
  } else {
    toast.textContent = "Failed.";
  }
  toast.className = `toast-${outcome} show`;
  let dur = 3000;
  // if (duration) {
  //   console.log("setting the duration to ", duration);
  //   dur = duration;
  // }
  document.body.prepend(toast);
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
    toast.remove();
  }, dur); // Duration for how long the toast is displayed
}

export function createDots(role) {
  const dots = document.createElement("div");
  dots.classList.add("message", role, "dots-message");
  const dotsContainer = document.createElement("div");
  dotsContainer.classList.add("dots-container");

  const singleDot1 = document.createElement("div");
  singleDot1.classList.add("dot");
  const singleDot2 = document.createElement("div");
  singleDot2.classList.add("dot");
  const singleDot3 = document.createElement("div");
  singleDot3.classList.add("dot");

  //connect them together
  dots.appendChild(dotsContainer);
  dotsContainer.appendChild(singleDot1);
  dotsContainer.appendChild(singleDot2);
  dotsContainer.appendChild(singleDot3);
  return dots;
}

function getBranchContainer(el) {
  for (let child of el.children) {
    if (child.classList.contains("branch-container")) {
      return child;
    }
  }
  return false;
}
