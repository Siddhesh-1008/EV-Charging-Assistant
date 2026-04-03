# ⚡ GenAI EV Charging Assistant

**GenAI EV Charging Assistant** is a professional-grade, safety-first mobility platform designed to optimize EV travel across India. It combines **Real-time Map Visualization**, **Context-Aware AI Logistics**, and a dedicated **Emergency Rescue System** to eliminate range anxiety and ensure driver safety.

---

## 🌟 Key Features

### 🧠 Logic-First AI Assistant (Charge AI)
A high-precision chatbot that prioritizes mathematical accuracy over generic LLM responses.
- **Instant Journey Logistics**: Calculates distance and trip costs (₹1.5/km) locally for 100% reliability.
- **Fuzzy Typo Correction**: Handles mistakes like "mumabi" or "punne" automatically.
- **Context Awareness**: Monitors your battery % and car model to provide precise charging time estimates.

### 🚩 Emergency Assistance System (SOS)
A automated safety layer that activates when the user is stranded.
- **Automated Detection**: Triggers if Battery < 10% AND no charging stations are reachable.
- **Rescue Console**: Provides immediate options for:
  - 🔋 **Mobile Charging Van** (Rescue dispatch)
  - 🚗 **Tow Service** (Nearest city transport)
  - 🏨 **Hotel Hub** (Stay with charging)
- **Safety Lock**: Hard-blocks standard trip planning during emergency states to prevent risky driving.

### 🗺️ Intelligent Route Planner
- **Real-time Range Projection**: Visualizes your reachable radius on a dynamic map.
- **Smart Station Filtering**: Highlights stations within your specific battery range.
- **Route Economics**: Compares EV trip costs against petrol vehicles to show real-time savings.

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS
- **Mapping**: Leaflet.js (OpenStreetMap)
- **AI Engine**: Google Gemini API (Pro)
- **Icons**: Lucide React
- **State Management**: React Context / Hooks

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Siddhesh-1008/EV-Charging-Assistant.git
   cd EV-Charging-Assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 📸 Screenshots

| High-Precision Map | Smart AI Assistant | Emergency Console |
| :---: | :---: | :---: |
| ![Map](/public/map_preview.png) | ![AI](/public/ai_preview.png) | ![Emergency](/public/sos_preview.png) |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for the EV Community in India.
