const checkProxyStatus = async () => {
  try {
    await chrome.proxy.settings.clear({ scope: "regular" });
    const response = await fetch("https://api.ipify.org", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Proxy check failed");
    console.log("Proxy is active");
    return true;
  } catch (error) {
    console.error("Proxy check failed:", error.message);
    return false;
  }
};

const getProxy = async () => {
  console.log("Tool Proxy Xoay được phát triển bởi YUNO TEAM");
  const { apiKey } = await chrome.storage.local.get("apiKey");
  const { timeReset } = await chrome.storage.local.get("timeReset");

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
    console.log("Calling API with key:", apiKey);
    const response = await fetch(
      `https://proxyxoay.org/api/get.php?key=${apiKey}&nhamang=random&tinhthanh=0`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await response.json();
    console.log("API response:", data);
    if (data.status === 100) {
      console.log("Proxy data:", data);
      setProxy(data.proxyhttp);
      const expirationTime = parseInt(data.message.match(/\d+/)[0], 10) * 1000;
      const expirationTimestamp = Date.now() + expirationTime;
      await chrome.storage.local.set({
        currentProxy: data,
        expirationTimestamp,
      });
      console.log("Sending proxyUpdate with waitTime:", expirationTime);
      chrome.runtime.sendMessage({
        type: "proxyUpdate",
        proxy: data,
        waitTime: expirationTime,
      });
      chrome.alarms.create("updateProxy", {
        delayInMinutes: expirationTime / 60000,
      });
      // Bắt đầu kiểm tra proxy định kỳ
      chrome.alarms.create("checkProxy", { periodInMinutes: 1 }); // Kiểm tra mỗi 30 giây
      chrome.alarms.create("timeReset", { periodInMinutes: timeReset });
    } else {
      const waitTimeMatch = data.message.match(/(\d+)/);
      const waitTime = waitTimeMatch
        ? parseInt(waitTimeMatch[0], 10) * 1000
        : 60000;
      await chrome.storage.local.set({
        currentError: { message: data.message, waitTime },
        expirationTimestamp: Date.now() + waitTime,
      });
      console.log("Sending error with waitTime:", waitTime);
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
      console.log("Proxy set to:", proxyString);
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
      console.log("Proxy hết hạn, đang lấy proxy mới...");
      getProxy();
      return;

    case "retryProxy":
      console.log("Đang thử lại sau lỗi...");
      getProxy();
      return;

    case "timeReset":
      console.log("Đang tự động reset...");
      getProxy();
      return;

    case "checkProxy":
      console.log("Checking proxy status...");
      checkProxyStatus().then((isActive) => {
        if (!isActive) {
          console.log("Proxy not active, fetching new proxy...");
          getProxy();
        }
      });
      return;

    default:
      console.log("Out case");
      return;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "setApiKey") {
    console.log("Received setApiKey messageacasc:", message);

    chrome.storage.local.set(
      { apiKey: message.apiKey, timeReset: message.timeReset },
      () => {
        console.log("Đã lưu API key:", message.apiKey);
        getProxy();
      }
    );
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
  } else if (message.type === "reloadApi") {
    console.log("reloadApi");
    getProxy();
  }
});
