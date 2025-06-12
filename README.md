# 🛡️ Proxy Xoay by YUNO TEAM

**VN:** Tiện ích mở rộng Chrome hỗ trợ fake IP tự động bằng **Proxy Xoay** và **Proxy Tĩnh** – được xây dựng dành riêng cho các nhu cầu: seeding, automation, crawl, chạy nhiều tài khoản...  
**EN:** Chrome extension for automatic **Rotating Proxy** IP and **static proxy** – tailored for seeding, automation, crawling, and managing multiple accounts.

---

## ⚙️ Tính năng nổi bật | Features

- 📌  
  **VN:** Hỗ trợ **Proxy Tĩnh** trong Phase 2.0 – cho phép duy trì 1 IP cố định nếu cần  
  **EN:** Support for **Static Proxy** in Phase 2.0 – allows using a fixed IP if needed

- 🔁  
  **VN:** Tự động đổi IP sau một khoảng thời gian nhất định (`autoReset`)  
  **EN:** Automatically change IP after a set time (`autoReset`)

- 🚫  
  **VN:** Không gọi lại proxy nếu không cần thiết  
  **EN:** Avoid unnecessary proxy requests

- 💥  
  **VN:** Tự động phát hiện proxy die và gọi mới  
  **EN:** Auto-detect dead proxy and fetch new one

- ⏱️  
  **VN:** Cập nhật proxy mới khi proxy cũ hết hạn  
  **EN:** Replace proxy when the old one expires

- 🔒  
  **VN:** Ẩn danh IP – tích hợp proxy dạng `ip:port:user:pass`  
  **EN:** IP anonymity – supports `ip:port:user:pass` format

- 🧠  
  **VN:** Sử dụng proxy theo nhà mạng (VT, FPT, VNPT) và tỉnh thành  
  **EN:** Use proxy by mobile carrier and region

---

### ⬇️ Tải nhanh | Direct Download

[📥 Bấm để tải ZIP](https://github.com/TruongHuuUy/rotating-proxy/archive/refs/heads/main.zip)


## 📦 Cài đặt | Installation

1. **VN:** Clone dự án về máy:  
   **EN:** Clone the project to your machine:

   ```bash
   git clone https://github.com/TruongHuuUy/rotating-proxy.git
   ```

1. **VN:** Clone dự án về máy:  
   **EN:** Clone the project to your machine:

   ```bash
   git clone https://github.com/TruongHuuUy/rotating-proxy.git
   ```

2. **VN:** Mở Chrome → `chrome://extensions/` → Bật **Developer mode** → **Load unpacked**  
   **EN:** Open Chrome → `chrome://extensions/` → Enable **Developer mode** → **Load unpacked** and select folder

3. **VN:** Mở popup của extension → nhập API Key từ [https://topproxyviet.com/](https://topproxyviet.com/)  
   **EN:** Open extension popup → enter API Key from [https://topproxyviet.com/](https://topproxyviet.com/)

---

## 📤 API Key và Proxy | API Key & Proxy

**VN:** Extension này sử dụng API từ `https://topproxyviet.com/`. Bạn cần có key và gói IP phù hợp.  
**EN:** This extension uses `https://topproxyviet.com/` API. You need a valid key and proxy package.

**Ví dụ | Example call:**

```
GET https://proxyxoay.org/api/get.php?key=<API_KEY>&nhamang=random&tinhthanh=0
```

---

## 🧪 Cách hoạt động | How It Works

| Trạng thái (VN)   | Status (EN)    | Hành động         | Action                  |
| ----------------- | -------------- | ----------------- | ----------------------- |
| 🔄 AutoReset: Bật | AutoReset: ON  | Gọi định kỳ       | Periodic proxy change   |
| 🔒 AutoReset: Tắt | AutoReset: OFF | Gọi khi cần       | Only change when needed |
| 💥 Proxy die      | Proxy dead     | Kiểm tra mỗi phút | Check every minute      |
| ✅ Proxy tốt      | Proxy alive    | Giữ nguyên        | Keep current proxy      |

---

## 📜 Cấu trúc file chính | File Structure

- `background.js`:  
  **VN:** xử lý proxy, alarm, messaging  
  **EN:** handles proxy logic, alarms, messaging

- `popup.html`:  
  **VN:** giao diện nhập API key  
  **EN:** input UI for API key & settings

- `manifest.json`:  
  **VN:** cấu hình extension  
  **EN:** extension config

---

## 💖 Donate

**VN:** Nếu bạn thấy extension này hữu ích và muốn ủng hộ mình:  
**EN:** If this extension helped you, feel free to support me:

| Momo QR                      | Ngân Hàng                  |
| ---------------------------- | -------------------------- |
| ![Momo QR](assets/momo.jpeg) | ![ACB QR](assets/ACB.jpeg) |

- Momo: **0943 704 750**
- ACB: **Trương Hữu Uy – 1614557**
- [☕ Mua cà phê cho tôi | Buy me a coffee](https://buymeacoffee.com/huuuy)

🌟 **VN:** Cảm ơn bạn rất nhiều!  
🌟 **EN:** Thank you so much!

---

## 📬 Liên hệ | Contact

- 🌐 Website: [https://topproxyviet.com/](https://topproxyviet.com/)
- 💬 Telegram Dev: [@huuuy1801](https://t.me/+oAuoVznXOhYwOGNl)
- 💬 FaceBook Team: [YUNO TEAM](https://www.facebook.com/YUNO.Team)
- 🎥 Youtube Team: [YUNO TEAM](https://www.youtube.com/@YUNO-Team)
