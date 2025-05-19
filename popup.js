const countdownIntervals = {
  proxy: null,
  error: null,
};

document.getElementById("saveKey").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;

  const timeReset = parseInt(
    document.getElementById("timeReset").value || 60,
    900
  );
  const autoReset = document.getElementById("autoReset").checked;
  const nhamang = document.getElementById("nhamang").value;
  const tinhthanh = document.getElementById("tinhthanh").value;
  if (!apiKey) return alert("Vui lòng nhập API key hợp lệ.");

  // countDown(document.getElementById("saveKey"), 60, "Kết nối");
  chrome.runtime.sendMessage({
    type: "setApiKey",
    apiKey,
    timeReset,
    autoReset,
    nhamang,
    tinhthanh,
  });
  alert("Đã lưu API key và cấu hình!");

  if (autoReset) {
    statusButton("checked");
  } else {
    statusButton("non-checked");
  }
});
document.getElementById("disconnectApi").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "disconnectProxy" }, () => {
    // Xóa dữ liệu hiển thị trên popup
    document.getElementById("proxyInfo").style.display = "none";
    document.getElementById("errorInfo").style.display = "none";
    document.getElementById("saveKey").style.display = "";
    document.getElementById("disconnectApi").style.display = "none";

    statusButton("default");
    alert("Đã ngắt kết nối proxy thành công!");
  });
});

document.getElementById("autoReset").addEventListener("click", () => {
  const elLabelTimeReset = document.getElementById("label-time-reset");
  const elTimeReset = document.getElementById("timeReset");
  const elAutoReset = document.getElementById("autoReset");

  if (elAutoReset.checked) {
    elTimeReset.disabled = false;
    elTimeReset.classList.remove("disabled");
    elLabelTimeReset.classList.remove("disabled");
  } else {
    elTimeReset.disabled = true;
    elTimeReset.classList.add("disabled");
    elLabelTimeReset.classList.add("disabled");
  }

  checkEditForm("autoReset", elAutoReset.checked);
});

document.getElementById("apiKey").addEventListener("input", () => {
  const value = document.getElementById("apiKey").value;
  checkEditForm("apiKey", value);
});

document.getElementById("timeReset").addEventListener("input", () => {
  const value = document.getElementById("timeReset").value;
  checkEditForm("timeReset", value);
});

document.getElementById("nhamang").addEventListener("input", () => {
  const value = document.getElementById("nhamang").value;
  checkEditForm("nhamang", value);
});

document.getElementById("tinhthanh").addEventListener("input", () => {
  const value = document.getElementById("tinhthanh").value;
  checkEditForm("tinhthanh", value);
});

const checkEditForm = (key, value) => {
  const elAutoReset = document.getElementById("autoReset");
  chrome.storage.local.get(key).then((data) => {
    if (data[key] !== value) return statusButton("new");
    if (!elAutoReset.checked) return statusButton("non-checked");
    statusButton("checked");
  });
};

chrome.storage.local.get(
  ["apiKey", "timeReset", "autoReset", "nhamang", "tinhthanh"],
  (data) => {
    const elSaveKey = document.getElementById("saveKey");
    const elDisconnect = document.getElementById("disconnectApi");

    const elApiKey = document.getElementById("apiKey");
    const elAutoReset = document.getElementById("autoReset");
    const elLabelTimeReset = document.getElementById("label-time-reset");
    const elTimeReset = document.getElementById("timeReset");
    const elNhaMang = document.getElementById("nhamang");
    const elTinhThanh = document.getElementById("tinhthanh");
    if (
      !data.apiKey &&
      !data.timeReset &&
      !data.autoReset &&
      !data.nhamang &&
      !data.tinhthanh
    ) {
      statusButton("default");
      return;
    }

    const apiKey = data.apiKey;
    const nhamang = data.nhamang;
    const tinhthanh = data.tinhthanh;
    const autoReset = data.autoReset;
    const timeReset = data.timeReset;

    if (!autoReset && apiKey) {
      statusButton("non-checked");
    }
    if (autoReset && apiKey) {
      statusButton("checked");
    }
    if (apiKey) elApiKey.value = apiKey;
    if (timeReset) elTimeReset.value = timeReset * 60;
    if (autoReset !== undefined) elAutoReset.checked = autoReset;
    if (nhamang) elNhaMang.value = nhamang;
    if (tinhthanh) elTinhThanh.value = tinhthanh;
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

const statusButton = (status) => {
  const elDisconnect = document.getElementById("disconnectApi");
  const elSaveKey = document.getElementById("saveKey");
  const elLabelTimeReset = document.getElementById("label-time-reset");
  const elTimeReset = document.getElementById("timeReset");

  switch (status) {
    case "non-checked":
      elSaveKey.textContent = "Đổi IP";
      elSaveKey.style.display = "block";
      elDisconnect.style.display = "block";
      break;
    case "checked":
      elTimeReset.disabled = false;
      elTimeReset.classList.remove("disabled");
      elLabelTimeReset.classList.remove("disabled");
      elSaveKey.style.display = "none";
      elDisconnect.style.display = "block";
      break;

    case "new":
      elSaveKey.textContent = "Kết nối mới";
      elSaveKey.style.display = "block";
      elDisconnect.style.display = "none";
      break;

    default:
      elSaveKey.textContent = "Kết nối";
      elSaveKey.style.display = "block";
      elDisconnect.style.display = "none";
      break;
  }
};

const checkLocalStorage = () => {};
