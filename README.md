# RescueBite
Smart Snake Detection &amp; SOS System with real-time heatmaps, AI-powered symptom analysis, location tracking, and emergency hospital assistance using Supabase.

# 🐍 Snake SOS – AI-Powered Detection & Emergency Response System

A smart web application designed to assist users in snakebite situations using **AI detection, real-time location tracking, SOS alerts, and intelligent symptom analysis**.

---

## 🚀 Features

### 🧠 AI Snake Detection
- Upload or capture image
- Detect snake type using ML model
- Identify:
  - Snake type
  - Confidence score
  - Risk level (Low / Medium / High)

---

### 📍 Real-Time Location Tracking
- Automatically captures user location
- Stores latitude, longitude, and area name
- Used across detection, SOS, and heatmap

---

### 🗺️ Dynamic Heatmap
- Displays snake detection activity in real-time
- Highlights high-risk areas
- Updates dynamically using database events

---

### 🚨 SOS Emergency System
- One-click emergency alert
- Sends user location + severity
- Tracks SOS history
- Helps authorities respond quickly

---

### 🏥 Hospital Finder
- Shows nearby hospitals on map
- Includes:
  - API-based hospitals
  - Manually added verified hospitals
- Ensures no nearby hospital is missed

---

### 💬 AI Symptom Checker
- Chat-based assistant
- Uses:
  - Detected snake data
  - User symptoms
- Provides:
  - Severity analysis
  - Personalized recommendations

---

### 👤 User Profile
- Tracks:
  - Detection history
  - SOS history
  - Symptom logs
- Displays personalized data

---

### 🌐 Multi-Language Support
- English
- Hindi  
(More languages can be added easily)

---

## 🛠️ Tech Stack

- **Frontend:** React / Vite
- **Backend:** Supabase
- **Database:** PostgreSQL
- **Storage:** Supabase Storage
- **Maps:** Google Maps / Mapbox
- **AI Model:** Teachable Machine

---

## 📂 Database Tables

- `profiles` – user data
- `reports` – detection & location data
- `emergencies` – SOS alerts
- `symptom_logs` – AI chat history
- `activity_logs` – user actions

---

## 🔄 Data Flow

### Detection Flow:
1. Capture image
2. Run AI model
3. Upload image
4. Store result in database

---

### SOS Flow:
1. Capture location
2. Send emergency alert
3. Store in database

---

### Symptom Checker:
1. Fetch latest detection
2. Combine with user symptoms
3. Generate AI response
4. Save chat log

---

## 📸 Screenshots

<img width="1896" height="956" alt="image" src="https://github.com/user-attachments/assets/beadfc79-4a45-4dcc-888f-c1aa41a0072c" />

<img width="1913" height="938" alt="image" src="https://github.com/user-attachments/assets/b194349e-4dc2-4486-9812-dc3555eab3b8" />

---

## ⚙️ Setup Instructions

1. Clone the repository:


Install dependencies:
npm install
Setup Supabase:
Create project
Add tables (profiles, reports, etc.)
Enable authentication
Create storage bucket: report-images
Run the app:
npm run dev
🔐 Environment Variables

Create .env file:

VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
🧪 Testing
Test detection with sample images
Trigger SOS
Verify database updates
Check heatmap behavior
🚀 Future Improvements
Mobile app (React Native)
Offline detection support
Admin dashboard
Real-time alerts to authorities
Voice-based symptom checker
👨‍💻 Author

Your Name

Siddhivinayak Patil  
Akanksha Kuvhare
Harsh Walke
Tirtha Patil 

Feel free to fork and improve the project!

📜 License

MIT License
