chrome.storage.local.get("autoReset").then(({ autoReset }) => {
  if (autoReset) getProxy();
});

const checkProxyStatus = async () => {
  try {
    const response = await fetch("https://api.ipify.org", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Proxy check failed");
    const ip = await response.text();
    console.log("Proxy IP hiện tại:", ip);
    return true;
  } catch (error) {
    console.error("Proxy check failed:", error);
    return false;
  }
};

const getProxy = async () => {
  console.log("Hướng dẫn sử dụng");
  console.log("https://github.com/TruongHuuUy/rotating-proxy");

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

const authListener = (details, callbackFn) => {
  chrome.storage.local.get("currentProxy", (data) => {
    if (!data.currentProxy) return callbackFn({});

    const [_, __, username, password] = data.currentProxy.proxyhttp.split(":");
    callbackFn({
      authCredentials: { username, password },
    });
  });
};

const setProxy = (proxyString) => {
  const [ip, port, username, password] = proxyString.split(":");

  // ✅ Remove listener cũ nếu có (tránh trùng hoặc gọi nhiều lần)
  try {
    chrome.webRequest.onAuthRequired.removeListener(authListener);
  } catch (e) {}

  if (username && password) {
    chrome.webRequest.onAuthRequired.addListener(
      authListener,
      { urls: ["<all_urls>"] },
      ["asyncBlocking"]
    );
  }

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
      console.log("✅ Proxy đã được cấu hình:", ip);
    }
  );
};

// ✅ Định nghĩa alarm handlers
const alarmHandlers = {
  updateProxy: getProxy,
  retryProxy: getProxy,
  timeReset: getProxy,
  checkProxy: () =>
    checkProxyStatus().then((isActive) => {
      if (!isActive) getProxy();
    }),
};

chrome.alarms.onAlarm.addListener((alarm) => {
  const handler = alarmHandlers[alarm.name];
  if (handler) return handler();
  console.log("Unknown alarm:", alarm.name);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "setApiKey") {
    clearAlarms();
    chrome.storage.local.set(
      {
        apiKey: message.apiKey,
        timeReset: message.timeReset / 60,
        autoReset: message.autoReset,
        nhamang: message.nhamang,
        tinhthanh: message.tinhthanh,
        usingStaticProxy: false,
      },
      () => {
        getProxy();
      }
    );
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
    getProxy();
    sendResponse({ status: "ok" });
  } else if (message.type === "disconnectProxy") {
    chrome.proxy.settings.clear({ scope: "regular" }, () => {
      chrome.alarms.clearAll();
      chrome.storage.local.remove([
        "currentProxy",
        "currentError",
        "expirationTimestamp",
      ]);
      sendResponse({ status: "disconnected" });
    });
    return true;
  } else if (message.type === "setStaticProxy") {
    const [ip, port, username, password] = message.proxy.split(":");

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
        if (username && password) {
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

        chrome.storage.local.set({
          staticProxy: message.proxy,
          usingStaticProxy: true,
        });

        clearAlarms();
      }
    );
  } else if (message.type === "disconnectStaticProxy") {
    chrome.proxy.settings.clear({ scope: "regular" }, () => {
      chrome.storage.local.remove(["staticProxy", "usingStaticProxy"]);
      chrome.webRequest.onAuthRequired.removeListener(() => {});
      sendResponse({ status: "static_disconnected" });
    });
    return true;
  } else if (message.type === "restartPopup") {
    chrome.action.getPopup({}, (popupUrl) => {
      if (popupUrl) {
        chrome.windows.create({
          url: chrome.runtime.getURL(popupUrl),
          type: "popup",
          width: 380,
          height: 580, // hoặc chiều cao bạn mong muốn
        });
      }
    });
    sendResponse({ status: "ok" });
    return true; // 🔁 Giữ kết nối nếu async
  }
});

const clearAlarms = () => {
  chrome.alarms.clear("updateProxy");
  chrome.alarms.clear("retryProxy");
  chrome.alarms.clear("timeReset");
  chrome.alarms.clear("checkProxy");
};

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("usingStaticProxy", (data) => {
    if (data.usingStaticProxy) {
      chrome.storage.local.get("staticProxy", (data) => {
        const [ip, port, username, password] = data.staticProxy.split(":");
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
          { value: proxyConfig, scope: "regular" },
          () => {
            if (username && password) {
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
          }
        );
      });
    }
  });
});
