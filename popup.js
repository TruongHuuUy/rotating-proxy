const countdownIntervals = {
  proxy: null,
  error: null,
};

document.getElementById("saveKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  const timeReset = parseInt(
    document.getElementById("timeReset").value || 1,
    10
  );
  const autoReset = document.getElementById("autoReset").checked;
  const nhamang = document.getElementById("nhamang").value;
  const tinhthanh = document.getElementById("tinhthanh").value;
  if (!apiKey) return alert("Vui lòng nhập API key hợp lệ.");

  countDown(document.getElementById("saveKey"), 60, "Kết nối");
  chrome.runtime.sendMessage({
    type: "setApiKey",
    apiKey,
    timeReset,
    autoReset,
    nhamang,
    tinhthanh,
  });
  alert("Đã lưu API key và cấu hình!");
});

// document.getElementById("reloadApi").addEventListener("click", () => {
//   countDown(document.getElementById("reloadApi"), 60, "Kết nối");
//   chrome.runtime.sendMessage({ type: "reloadApi" });
// });

chrome.storage.local.get(
  ["apiKey", "timeReset", "autoReset", "nhamang", "tinhthanh"],
  (data) => {
    if (data.apiKey) document.getElementById("apiKey").value = data.apiKey;
    if (data.timeReset)
      document.getElementById("timeReset").value = data.timeReset;
    if (data.autoReset !== undefined)
      document.getElementById("autoReset").checked = data.autoReset;
    if (data.nhamang) document.getElementById("nhamang").value = data.nhamang;
    if (data.tinhthanh)
      document.getElementById("tinhthanh").value = data.tinhthanh;
  }
);

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: "requestProxyUpdate" });
});

chrome.runtime.onMessage.addListener((message) => {
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
  const connectionStatus = document.getElementById("connectionStatus");
  connectionStatus.style.display = "block";
};

const displayError = (message, waitTime) => {
  document.getElementById("proxyInfo").style.display = "none";
  document.getElementById("errorInfo").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
  startCountdown(waitTime, "error");
};

const startCountdown = (waitTime, type) => {
  if (countdownIntervals[type]) {
    clearInterval(countdownIntervals[type]);
    countdownIntervals[type] = null;
  }

  const countdownElement = document.getElementById(
    type === "proxy" ? "proxyExpires" : "countdown"
  );

  if (waitTime <= 0) {
    countdownElement.textContent =
      type === "proxy" ? "Đang lấy proxy mới..." : "Đang thử lại...";
    return;
  }

  let timeLeft = Math.floor(waitTime / 1000);
  countdownElement.textContent = `${timeLeft} giây`;

  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownIntervals[type] = null;
      countdownElement.textContent =
        type === "proxy" ? "Đang lấy proxy mới..." : "Đang thử lại...";
      return;
    }
    countdownElement.textContent = `${timeLeft} giây`;
  }, 1000);

  countdownIntervals[type] = interval;
};
