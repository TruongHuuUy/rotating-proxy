const checkProxyStatus = async () => {
  try {
    await chrome.proxy.settings.clear({ scope: "regular" });
    const response = await fetch("https://api.ipify.org", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Proxy check failed");
    // console.log("Proxy is active");
    return true;
  } catch (error) {
    console.error("Proxy check failed:", error.message);
    return false;
  }
};

const getProxy = async () => {
  console.log("Tool Proxy Xoay được phát triển bởi YUNO TEAM");
  const { apiKey, timeReset, autoReset, nhamang, tinhthanh } =
    await chrome.storage.local.get([
      "apiKey",
      "timeReset",
      "autoReset",
      "nhamang",
      "tinhthanh",
    ]);
  if (!apiKey) {
    chrome.runtime.sendMessage({
      type: "error",
      message: "Vui lòng nhập API key trong popup.",
      waitTime: 0,
    });
    return;
  }

  await chrome.proxy.settings.clear({ scope: "regular" });
  try {
    const response = await fetch(
      `https://proxyxoay.org/api/get.php?key=${apiKey}&nhamang=${
        nhamang || "random"
      }&tinhthanh=${tinhthanh || "0"}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await response.json();
    // console.log("API response:", data);
    if (data.status === 100) {
      setProxy(data.proxyhttp);
      const expirationTime = parseInt(data.message.match(/\d+/)[0], 10) * 1000;
      const expirationTimestamp = Date.now() + expirationTime;
      await chrome.storage.local.set({
        currentProxy: data,
        expirationTimestamp,
      });
      chrome.runtime.sendMessage({
        type: "proxyUpdate",
        proxy: data,
        waitTime: expirationTime,
      });
      chrome.alarms.create("updateProxy", {
        delayInMinutes: expirationTime / 60000,
      });
      chrome.alarms.create("checkProxy", { periodInMinutes: 1 });
      if (autoReset) {
        const resetMinutes =
          Number.isFinite(timeReset) && timeReset > 0 ? timeReset : 1;
        chrome.alarms.create("timeReset", { periodInMinutes: resetMinutes });
      } else {
        console.log("Auto reset disabled, skipping timeReset alarm");
      }
    } else {
      const waitTimeMatch = data.message.match(/(\d+)/);
      const waitTime = waitTimeMatch
        ? parseInt(waitTimeMatch[0], 10) * 1000
        : 60000;
      await chrome.storage.local.set({
        currentError: { message: data.message, waitTime },
        expirationTimestamp: Date.now() + waitTime,
      });
      chrome.runtime.sendMessage({
        type: "error",
        message: data.message,
        waitTime,
      });
      chrome.alarms.create("retryProxy", { delayInMinutes: waitTime / 60000 });
    }
  } catch (error) {
    const waitTime = 60000;
    await chrome.storage.local.set({
      currentError: { message: error.message, waitTime },
      expirationTimestamp: Date.now() + waitTime,
    });
    console.error("API call failed:", error.message);
    chrome.runtime.sendMessage({
      type: "error",
      message: error.message,
      waitTime,
    });
    chrome.alarms.create("retryProxy", { delayInMinutes: 1 });
  }
};

const setProxy = (proxyString) => {
  const [ip, port, username, password] = proxyString.split(":");
  const proxyConfig = {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: "http",
        host: ip,
        port: parseInt(port),
      },
    },
  };

  chrome.proxy.settings.set(
    {
      value: proxyConfig,
      scope: "regular",
    },
    () => {
      chrome.webRequest.onAuthRequired.addListener(
        (details, callbackFn) => {
          callbackFn({
            authCredentials: { username, password },
          });
        },
        { urls: ["<all_urls>"] },
        ["asyncBlocking"]
      );
    }
  );
};

getProxy();

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "updateProxy":
      getProxy();
      break;
    case "retryProxy":
      getProxy();
      break;
    case "timeReset":
      getProxy();
      break;
    case "checkProxy":
      checkProxyStatus().then((isActive) => {
        if (!isActive) {
          getProxy();
        }
      });
      break;
    default:
      console.log("Unknown alarm:", alarm.name);
      break;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "setApiKey") {
    // console.log("Received setApiKey message:", message);
    chrome.storage.local.set(
      {
        apiKey: message.apiKey,
        timeReset: message.timeReset,
        autoReset: message.autoReset,
        nhamang: message.nhamang,
        tinhthanh: message.tinhthanh,
      },
      () => {
        // console.log(
        //   "Đã lưu API key:",
        //   message.apiKey,
        //   "timeReset:",
        //   message.timeReset,
        //   "autoReset:",
        //   message.autoReset,
        //   "nhamang:",
        //   message.nhamang,
        //   "tinhthanh:",
        //   message.tinhthanh
        // );
        getProxy();
      }
    );
    // Gửi phản hồi để tránh lỗi message port closed (dù không bắt buộc)
    sendResponse({ status: "ok" });
  } else if (message.type === "requestProxyUpdate") {
    chrome.storage.local.get(
      ["currentProxy", "currentError", "expirationTimestamp"],
      (data) => {
        if (data.currentProxy && data.expirationTimestamp) {
          const remainingTime = Math.max(
            0,
            data.expirationTimestamp - Date.now()
          );
          chrome.runtime.sendMessage({
            type: "proxyUpdate",
            proxy: data.currentProxy,
            waitTime: remainingTime,
          });
        } else if (data.currentError && data.expirationTimestamp) {
          const remainingTime = Math.max(
            0,
            data.expirationTimestamp - Date.now()
          );
          chrome.runtime.sendMessage({
            type: "error",
            message: data.currentError.message,
            waitTime: remainingTime,
          });
        } else {
          getProxy();
        }
      }
    );
    sendResponse({ status: "ok" });
  } else if (message.type === "reloadApi") {
    console.log("Received reloadApi message");
    getProxy();
    sendResponse({ status: "ok" });
  }
});
