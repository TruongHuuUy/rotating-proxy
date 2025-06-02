const countdownIntervals = {
  proxy: null,
  error: null,
};
let manualCountdownInterval = null;
let simpleCountdownInterval = null;
const countdownTime = 60;

document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    chrome.storage.local.set({ selectedTab: tab });

    document
      .querySelectorAll(".tab-button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    document
      .querySelectorAll(".tab-content")
      .forEach((el) => el.classList.remove("active"));
    document.getElementById("tab-" + tab).classList.add("active");

    // ✅ Nếu quay lại tab Proxy Xoay → hiển thị lại thông tin nếu có
    if (tab === "dynamic") {
      document.getElementById("statusMessage").style.display = "block";
      chrome.storage.local.get(
        ["currentProxy", "expirationTimestamp"],
        ({ currentProxy, expirationTimestamp }) => {
          if (currentProxy && expirationTimestamp) {
            const waitTime = Math.max(0, expirationTimestamp - Date.now());
            displayProxyInfo(currentProxy, waitTime);
          }
        }
      );
    } else {
      // ✅ Nếu sang tab khác → ẩn thông tin proxy xoay
      document.getElementById("proxyInfo").style.display = "none";
      document.getElementById("statusMessage").style.display = "none";
    }
  });
});

chrome.storage.local.get("selectedTab", ({ selectedTab }) => {
  const tab = selectedTab || "dynamic";
  const btn = document.querySelector(`.tab-button[data-tab="${tab}"]`);
  if (btn) btn.click();
});

//Xoay
document.getElementById("saveKey").addEventListener("click", () => {
  chrome.storage.local.remove("staticProxyConnected");
  chrome.runtime.sendMessage({ type: "disconnectStaticProxy" });

  document.getElementById("disconnectStaticProxy").style.display = "none";
  document.getElementById("saveStaticProxy").style.display = "block";
  document.getElementById("disconnectStaticProxy").classList.remove("danger");

  const msg = document.getElementById("staticStatusMessage");
  msg.textContent = "❌ Proxy tĩnh đã được ngắt kết nối.";
  msg.style.display = "block";
  msg.style.color = "#f87171";

  // ✅ Lấy giá trị từ các trường nhập liệu
  const apiKey = document.getElementById("apiKey").value;

  const timeReset = parseInt(
    document.getElementById("timeReset").value || 60,
    900
  );
  const autoReset = document.getElementById("autoReset").checked;
  const nhamang = document.getElementById("nhamang").value;
  const tinhthanh = document.getElementById("tinhthanh").value;
  // if (!apiKey) return alert("Vui lòng nhập API key hợp lệ.");

  chrome.storage.local.set({ isDisconnected: false });

  chrome.runtime.sendMessage({
    type: "setApiKey",
    apiKey,
    timeReset,
    autoReset,
    nhamang,
    tinhthanh,
  });

  if (autoReset) {
    statusButton("checked");
  } else {
    // startManualCountdown(true);
    startSimpleCountdown();
    statusButton("non-checked");
  }
});

document.getElementById("disconnectApi").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "disconnectProxy" }, () => {
    // ✅ Thông báo trạng thái nhỏ
    const statusMsg = document.getElementById("statusMessage");
    statusMsg.style.display = "block";
    statusMsg.style.color = "#f87171";
    statusMsg.textContent = "⚠️ Proxy đã được ngắt hoàn toàn.";

    chrome.storage.local.set({ isDisconnected: true });
    chrome.storage.local.remove("manualCountdownStart");
    if (manualCountdownInterval) {
      clearInterval(manualCountdownInterval);
      statusButton("default");
    }

    if (simpleCountdownInterval) clearInterval(simpleCountdownInterval);

    // Ẩn thông tin proxy
    document.getElementById("proxyInfo").style.display = "none";
    // document.getElementById("errorInfo").style.display = "none";
    document.getElementById("saveKey").style.display = "";
    document.getElementById("disconnectApi").style.display = "none";

    // Reset nội dung proxy hiển thị
    document.getElementById("proxyAddress").textContent = "";
    document.getElementById("proxyUsername").textContent = "";
    document.getElementById("proxyPassword").textContent = "";
    document.getElementById("proxyProvider").textContent = "";
    document.getElementById("proxyLocation").textContent = "";
    document.getElementById("proxyExpires").textContent = "";

    // ✅ Dừng các countdown nếu còn chạy
    if (countdownIntervals.proxy) clearInterval(countdownIntervals.proxy);
    if (countdownIntervals.error) clearInterval(countdownIntervals.error);

    countdownIntervals.proxy = null;
    countdownIntervals.error = null;

    statusButton("default");
  });
});

//Tinh
document.getElementById("saveStaticProxy").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "disconnectProxy" }, () => {
    // ✅ Thông báo trạng thái nhỏ
    const statusMsg = document.getElementById("statusMessage");
    statusMsg.style.display = "none";

    chrome.storage.local.set({ isDisconnected: true });
    chrome.storage.local.remove("manualCountdownStart");
    if (manualCountdownInterval) {
      clearInterval(manualCountdownInterval);
      statusButton("default");
    }
    if (simpleCountdownInterval) clearInterval(simpleCountdownInterval);

    // Ẩn thông tin proxy
    document.getElementById("proxyInfo").style.display = "none";
    // document.getElementById("errorInfo").style.display = "none";
    document.getElementById("saveKey").style.display = "";
    document.getElementById("disconnectApi").style.display = "none";

    // Reset nội dung proxy hiển thị
    document.getElementById("proxyAddress").textContent = "";
    document.getElementById("proxyUsername").textContent = "";
    document.getElementById("proxyPassword").textContent = "";
    document.getElementById("proxyProvider").textContent = "";
    document.getElementById("proxyLocation").textContent = "";
    document.getElementById("proxyExpires").textContent = "";

    // ✅ Dừng các countdown nếu còn chạy
    if (countdownIntervals.proxy) clearInterval(countdownIntervals.proxy);
    if (countdownIntervals.error) clearInterval(countdownIntervals.error);

    countdownIntervals.proxy = null;
    countdownIntervals.error = null;

    statusButton("default");
  });

  chrome.storage.local.set({ staticProxyConnected: true });

  const proxy = document.getElementById("staticProxy").value.trim();
  if (!proxy || !proxy.includes(":")) {
    return;
  }

  chrome.storage.local.set({ staticProxy: proxy });
  chrome.runtime.sendMessage({ type: "setStaticProxy", proxy });

  document.getElementById("saveStaticProxy").style.display = "none";
  const disconnectBtn = document.getElementById("disconnectStaticProxy");
  disconnectBtn.style.display = "block";
  disconnectBtn.classList.add("danger");

  const msg = document.getElementById("staticStatusMessage");
  msg.textContent = "✅ Đã kết nối proxy tĩnh.";
  msg.style.display = "block";
  msg.style.color = "#4ade80";
});

document
  .getElementById("disconnectStaticProxy")
  .addEventListener("click", () => {
    chrome.storage.local.remove("staticProxyConnected");
    chrome.runtime.sendMessage({ type: "disconnectStaticProxy" });

    document.getElementById("disconnectStaticProxy").style.display = "none";
    document.getElementById("saveStaticProxy").style.display = "block";
    document.getElementById("disconnectStaticProxy").classList.remove("danger");

    const msg = document.getElementById("staticStatusMessage");
    msg.textContent = "❌ Proxy tĩnh đã được ngắt kết nối.";
    msg.style.display = "block";
    msg.style.color = "#f87171";
  });

document.getElementById("autoReset").addEventListener("click", () => {
  const elAutoReset = document.getElementById("autoReset");

  statusTimeReset(elAutoReset.checked);
  checkEditForm("autoReset", elAutoReset.checked);
});

document.getElementById("apiKey").addEventListener("input", () => {
  const value = document.getElementById("apiKey").value;
  checkEditForm("apiKey", value);
});

document.getElementById("nhamang").addEventListener("input", () => {
  const value = document.getElementById("nhamang").value;
  checkEditForm("nhamang", value);
});

document.getElementById("tinhthanh").addEventListener("input", () => {
  const value = document.getElementById("tinhthanh").value;
  checkEditForm("tinhthanh", value);
});

chrome.storage.local.get("manualCountdownStart", (data) => {
  // if (data.manualCountdownStart) startManualCountdown();
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
  [
    "apiKey",
    "timeReset",
    "autoReset",
    "nhamang",
    "tinhthanh",
    "isDisconnected",
    "staticProxy",
    "manualCountdownStart",
  ],
  (data) => {
    const elApiKey = document.getElementById("apiKey");
    const elAutoReset = document.getElementById("autoReset");
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

    // if (data.manualCountdownStart) startManualCountdown();

    const apiKey = data.apiKey;
    const nhamang = data.nhamang;
    const tinhthanh = data.tinhthanh;
    const autoReset = data.autoReset;
    const timeReset = data.timeReset;
    const disconnected = data.isDisconnected;

    statusTimeReset(autoReset);
    statusMessageDisconnect(disconnected);

    if (apiKey && autoReset) {
      statusButton("checked");
    } else if (apiKey && !autoReset) {
      statusButton("non-checked");
    }

    if (apiKey) elApiKey.value = apiKey;
    if (timeReset) elTimeReset.value = timeReset * 60;
    if (autoReset !== undefined) elAutoReset.checked = autoReset;
    if (nhamang) elNhaMang.value = nhamang;
    if (tinhthanh) elTinhThanh.value = tinhthanh;

    if (disconnected) {
      statusButton("default");
      return;
    }
  }
);

document.addEventListener("DOMContentLoaded", () => {
  // 1. Khôi phục tab đang chọn
  chrome.storage.local.get("selectedTab", ({ selectedTab }) => {
    const tab = selectedTab || "dynamic";
    const btn = document.querySelector(`.tab-button[data-tab="${tab}"]`);
    if (btn) btn.click();
  });

  // 2. Khôi phục proxy tĩnh đã nhập
  chrome.storage.local.get(
    ["staticProxy", "staticProxyConnected"],
    ({ staticProxy, staticProxyConnected }) => {
      if (staticProxy) {
        document.getElementById("staticProxy").value = staticProxy;
      }

      if (staticProxyConnected) {
        const disconnectBtn = document.getElementById("disconnectStaticProxy");
        disconnectBtn.style.display = "block";
        disconnectBtn.classList.add("danger");

        document.getElementById("saveStaticProxy").style.display = "none";

        const msg = document.getElementById("staticStatusMessage");
        msg.textContent = "✅ Đã kết nối proxy thành công.";
        msg.style.display = "block";
        msg.style.color = "#4ade80";
      }
    }
  );

  // 3. Chỉ gọi proxy xoay nếu chưa bị ngắt & không đang dùng proxy tĩnh
  chrome.storage.local.get(["isDisconnected", "usingStaticProxy"], (data) => {
    if (data.isDisconnected || data.usingStaticProxy) return;
    chrome.runtime.sendMessage({ type: "requestProxyUpdate" });
  });

  resumeSimpleCountdown();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "proxyUpdate") {
    displayProxyInfo(message.proxy, message.waitTime);
  } else if (message.type === "error") {
    console.log("Error:", message.message);
    if (document.getElementById("apiKey").value === "") return;
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
  // document.getElementById("errorInfo").style.display = "none";
  const [ip, port, username, password] = proxy.proxyhttp.split(":");
  document.getElementById("proxyAddress").textContent = `${ip}:${port}`;
  document.getElementById("proxyUsername").textContent = username;
  document.getElementById("proxyPassword").textContent = password;
  document.getElementById("proxyProvider").textContent = proxy["Nha Mang"];
  document.getElementById("proxyLocation").textContent = proxy["Vi Tri"];
  startCountdown(waitTime, "proxy");
};

const displayError = (message, waitTime) => {
  if (manualCountdownInterval) {
    clearInterval(manualCountdownInterval);
    manualCountdownInterval = null;
  }

  const statusMsg = document.getElementById("statusMessage");

  document.getElementById("proxyInfo").style.display = "none";
  document.getElementById("errorMessage").textContent = message;

  // Bắt đầu đếm ngược
  if (countdownIntervals.error) clearInterval(countdownIntervals.error);

  let timeLeft = Math.floor(waitTime / 1000);
  statusMsg.style.display = "block";
  statusMsg.style.color = "#f87171";
  statusMsg.textContent = `❌ Tự động kết nối lại sau: ${timeLeft}s`;

  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownIntervals.error = null;
      statusMsg.textContent = "🔁 Đang thử lại proxy...";
      return;
    }
    statusMsg.textContent = `❌ Tự động kết nối lại sau: ${timeLeft}s`;
  }, 1000);

  countdownIntervals.error = interval;
};

const startCountdown = (waitTime, type) => {
  const statusMsg = document.getElementById("statusMessage");
  const textContent = type === "proxy" ? "Đang lý proxy..." : "Đang thử lý...";

  if (countdownIntervals[type]) {
    clearInterval(countdownIntervals[type]);
    clearInterval(manualCountdownInterval);
  }

  const countdownElement = document.getElementById(
    type === "proxy" ? "proxyExpires" : "countdown"
  );

  if (waitTime <= 0) {
    countdownElement.textContent = textContent;
    statusMsg.textContent = textContent;
    return;
  }

  let timeLeft = Math.floor(waitTime / 1000);
  countdownElement.textContent = `${timeLeft} giây`;

  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownIntervals[type] = null;

      countdownElement.textContent = textContent;
      statusMsg.textContent = textContent;
      return;
    }

    countdownElement.textContent = `${timeLeft} giây`;
  }, 1000);

  countdownIntervals[type] = interval;
  statusMessageDisconnect(false);
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
      // Hiển thị trạng thái mặc định
      elSaveKey.textContent = "Kết nối";
      elSaveKey.style.display = "block";
      elDisconnect.style.display = "none";
      elSaveKey.disabled = false;
      elSaveKey.classList.remove("disabled");

      // ✅ Dừng mọi countdown còn lại
      if (manualCountdownInterval) {
        clearInterval(manualCountdownInterval);
        manualCountdownInterval = null;
      }
      if (countdownIntervals.proxy) {
        clearInterval(countdownIntervals.proxy);
        countdownIntervals.proxy = null;
      }
      if (countdownIntervals.error) {
        clearInterval(countdownIntervals.error);
        countdownIntervals.error = null;
      }

      // ✅ (Tuỳ chọn) Xóa text thời gian nếu cần
      const countdownEl = document.getElementById("proxyExpires");
      if (countdownEl) countdownEl.textContent = "";

      const statusMsg = document.getElementById("statusMessage");
      if (statusMsg) statusMsg.textContent = "";

      break;
  }
};

const statusTimeReset = (isChecked) => {
  const elLabelTimeReset = document.getElementById("label-time-reset");
  const elTimeReset = document.getElementById("timeReset");

  switch (isChecked) {
    case false:
      elTimeReset.disabled = true;
      elTimeReset.classList.add("disabled");
      elLabelTimeReset.classList.add("disabled");
      break;
    case true:
      elTimeReset.disabled = false;
      elTimeReset.classList.remove("disabled");
      elLabelTimeReset.classList.remove("disabled");
      break;

    default:
      break;
  }
};

const statusMessageDisconnect = (isDisconnected) => {
  const statusMsg = document.getElementById("statusMessage");
  if (isDisconnected) {
    statusMsg.style.display = "block";
    statusMsg.style.color = "#f87171";
    statusMsg.textContent = "⚠️ Proxy đã được ngắt hoàn toàn.";
    return;
  } else {
    statusMsg.style.display = "block";
    statusMsg.style.color = "#4ade80";
    statusMsg.textContent = "✅ Đã kết nối proxy thành công.";
    return;
  }
};

const startManualCountdown = (reset = false) => {
  const elBtn = document.getElementById("saveKey");

  if (manualCountdownInterval) clearInterval(manualCountdownInterval);

  if (reset) {
    chrome.storage.local.set({ manualCountdownStart: Date.now() });
  }

  chrome.storage.local.get("manualCountdownStart", (data) => {
    const startTime = data.manualCountdownStart;
    if (!startTime) return;

    var timePassed = Math.floor((Date.now() - startTime) / 1000);

    elBtn.textContent = `Đổi IP (${timePassed} giây)`;
    elBtn.disabled = timePassed < 60;
    elBtn.classList.toggle("disabled", timePassed < 60);

    manualCountdownInterval = setInterval(() => {
      timePassed++;
      elBtn.textContent = `Đổi IP (${timePassed} giây)`;

      if (timePassed === 60) {
        elBtn.disabled = false;
        elBtn.classList.remove("disabled");
      }
    }, 1000);
  });
};

const startSimpleCountdown = () => {
  const elBtn = document.getElementById("saveKey");

  // Dừng bộ đếm cũ nếu có
  if (simpleCountdownInterval) clearInterval(simpleCountdownInterval);

  // Lưu thời điểm bắt đầu
  const startTime = Date.now();
  chrome.storage.local.set({ simpleCountdownStart: startTime });

  elBtn.disabled = true;
  elBtn.classList.add("disabled");

  const updateCountdown = () => {
    const timePassed = Math.floor((Date.now() - startTime) / 1000);

    if (timePassed >= countdownTime) {
      elBtn.textContent = "Đổi IP";
      elBtn.disabled = false;
      elBtn.classList.remove("disabled");
    }

    elBtn.textContent = `Đổi IP (${timePassed}s)`;
    chrome.storage.local.set({ simpleCountdownTime: timePassed });
  };

  updateCountdown(); // cập nhật lần đầu
  simpleCountdownInterval = setInterval(updateCountdown, 1000);
};

const resumeSimpleCountdown = () => {
  chrome.storage.local.get("simpleCountdownStart", (data) => {
    if (!data.simpleCountdownStart) return;

    const startTime = data.simpleCountdownStart;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    const elBtn = document.getElementById("saveKey");

    let timePassed = elapsed;

    elBtn.textContent = `Đổi IP (${timePassed}s)`;

    simpleCountdownInterval = setInterval(() => {
      timePassed++;

      if (timePassed >= countdownTime) {
        elBtn.textContent = "Đổi IP";
        elBtn.disabled = false;
        elBtn.classList.remove("disabled");
      } else {
        elBtn.disabled = true;
        elBtn.classList.add("disabled");
      }

      elBtn.textContent = `Đổi IP (${timePassed}s)`;
      chrome.storage.local.set({ simpleCountdownTime: timePassed });
    }, 1000);
  });
};

const clearAllIntervals = () => {
  if (manualCountdownInterval) {
    clearInterval(manualCountdownInterval);
    manualCountdownInterval = null;
  }
  if (simpleCountdownInterval) {
    clearInterval(simpleCountdownInterval);
    simpleCountdownInterval = null;
  }
  if (countdownIntervals.proxy) {
    clearInterval(countdownIntervals.proxy);
    countdownIntervals.proxy = null;
  }
  if (countdownIntervals.error) {
    clearInterval(countdownIntervals.error);
    countdownIntervals.error = null;
  }
};
