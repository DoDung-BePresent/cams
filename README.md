# 3. Register Content of Capstone Project

## 3.1. Capstone Project Name

- **English:** Context-Aware AI Music Streaming System for Retail Stores based on POS Data and AI Music Generation.
- **Vietnamese:** Hệ thống phát nhạc thông minh theo ngữ cảnh cho cửa hàng bán lẻ dựa trên dữ liệu POS và công nghệ tạo nhạc bằng AI.
- **Abbreviation:** CAMS (Context-Aware Music System)

---

## 3.2. Context

In modern retail, background music greatly influences customer mood, shopping experience, and brand atmosphere. However, most stores still use static playlists that do not adapt to real-time factors such as customer flow, sales, or environment. With the rise of cloud and IoT technologies, stores can now deliver smarter, data-driven experiences.

This project proposes a system that uses POS data and external AI Music APIs to automatically select or generate background music that fits the store’s context. The goal is to enhance customer engagement and help retailers manage in-store music more efficiently and dynamically.

---

## 3.3. Proposed Solutions

1.  **Develop a context-aware music streaming system:** Adjusts background music based on real-time data such as POS transactions, customer density, and environment.
2.  **Integrate third-party AI Music APIs:** Generate or recommend music that matches the detected store mood.
3.  **Build a cloud-based platform:** Collect and process context data, request suitable tracks from APIs, and manage multi-store operations.
4.  **Deploy edge playback devices:** Use ESP32 or an Android app in stores to receive and play music with low latency.
5.  **Implement a scalable architecture:** Use cloud services and IoT protocols (MQTT/HTTP) to ensure reliability and synchronization across all stores.

---

## 3.4. Requirements

### A. Functional Requirements

| Category               | Requirement Description                                                                                    |
| :--------------------- | :--------------------------------------------------------------------------------------------------------- |
| **User Management**    | Secure login for Store Managers; role separation (Admin/Manager); view device status & current track.      |
| **Data Collection**    | Collect simulated POS data; retrieve real-time weather via public API; allow manual mood override.         |
| **Context Processing** | Combine POS & weather data to determine mood (e.g., High sales + Sunny = Energetic); dynamic updates.      |
| **AI Generation**      | Integrate AI music services; fallback mechanism if API fails; switch tracks within 3–5s of context change. |
| **Streaming & Edge**   | Distribute music to edge devices; support Play/Pause/Skip/Volume; offline playback via caching.            |
| **Dashboard**          | Web UI for Admin to monitor active stores, context signals, and manual playback control for demos.         |

### B. Non-functional Requirements

- **High Availability:** Maintain reliability during business hours.
- **Security:** Encrypted communication between cloud and edge devices.
- **Scalability:** Support for multiple retail branches.
- **Usability:** Intuitive and responsive UI for non-technical staff.
