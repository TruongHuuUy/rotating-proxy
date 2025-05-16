document.getElementById("saveKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  const timeReset = document.getElementById("timeReset").value
    ? document.getElementById("timeReset").value / 60
    : 1;
  if (!apiKey) return alert("Vui lòng nhập API key hợp lệ.");

  countDown(document.getElementById("saveKey"), 60, "Xác nhận");
  chrome.runtime.sendMessage({ type: "setApiKey", apiKey, timeReset }, () => {
    alert("Đã lưu API key!");
  });
});

document.getElementById("reloadApi").addEventListener("click", () => {
  countDown(document.getElementById("reloadApi"), 60, "Đổi IP Chủ Động");
  chrome.runtime.sendMessage({ type: "reloadApi" });
});

chrome.storage.local.get("apiKey", (data) => {
  if (!data.apiKey) return;
  document.getElementById("apiKey").value = data.apiKey;
});

chrome.storage.local.get("timeReset", (data) => {
  if (!data.timeReset) return;
  document.getElementById("timeReset").value = data.timeReset * 60;
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: "requestProxyUpdate" });
});

chrome.runtime.onMessage.addListener((message) => {
  console.log("Received message:", message);
  if (message.type === "proxyUpdate") {
    displayProxyInfo(message.proxy, message.waitTime);
  } else if (message.type === "error") {
    displayError(message.message, message.waitTime);
  }
});

const countDown = (element, waitTime, textContent) => {
  element.disabled = true;
  element.classList.add("disabled");

  element.textContent = `Loading... ${waitTime}s`;

  const interval = setInterval(() => {
    waitTime--;
    if (waitTime > 0) {
      element.textContent = `Loading... ${waitTime}s`;
    } else {
      clearInterval(interval);
      element.textContent = textContent;
      element.disabled = false;
      element.classList.remove("disabled");
    }
  }, 1000);
};

const displayProxyInfo = (proxy, waitTime) => {
  document.getElementById("proxyInfo").style.display = "block";
  document.getElementById("errorInfo").style.display = "none";
  const [ip, port, username, password] = proxy.proxyhttp.split(":");
  document.getElementById("proxyAddress").textContent = `${ip}:${port}`;
  document.getElementById("proxyUsername").textContent = username;
  document.getElementById("proxyPassword").textContent = password;
  document.getElementById("proxyProvider").textContent = proxy["Nha Mang"];
  document.getElementById("proxyLocation").textContent = proxy["Vi Tri"];
  startCountdown(waitTime, "proxy");
};

const displayError = (message, waitTime) => {
  document.getElementById("proxyInfo").style.display = "none";
  document.getElementById("errorInfo").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
  startCountdown(waitTime, "error");
};

const startCountdown = (waitTime, type) => {
  console.log("Starting countdown with waitTime:", waitTime, "type:", type);
  if (waitTime <= 0) {
    document.getElementById(
      type === "proxy" ? "proxyExpires" : "countdown"
    ).textContent =
      type === "proxy" ? "Đang lấy proxy mới..." : "Đang thử lại...";
    return;
  }
  let timeLeft = Math.floor(waitTime / 1000);
  const countdownElement = document.getElementById(
    type === "proxy" ? "proxyExpires" : "countdown"
  );
  countdownElement.textContent = `${timeLeft} giây`;
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownElement.textContent =
        type === "proxy" ? "Đang lấy proxy mới..." : "Đang thử lại...";
      return;
    }
    countdownElement.textContent = `${timeLeft} giây`;
  }, 1000);
};
