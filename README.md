# Urban Intelligence Platform

**A real-time, physics-aware simulation engine for urban resilience planning.**

---

## 🚀 Key Features

### 🌎 Interactive Maps with Cascading Risks
Unlike static dashboards, our platform features **Geospatial Cascading Visualization**. Trend maps update in real-time to show how a localized event (like a flood in one zone) triggers cascading risks across the city:
*   **Layered Impact**: See how environmental stress ripples into public health and food logistics on a unified map interface.
*   **Visual Logic**: Color-coded risk zones (Green/Yellow/Red) evolve instantly as you simulate scenarios.

### 💻 Fully Integrated Web Interface
The entire system is accessible via a modern, responsive web dashboard:
*   **Scenario Chat**: Speak to the city engine naturally (e.g., *"Simulate a 3-day heatwave"*).
*   **Live Dashboard**: Monitor real-time AQI, Hospital Load, and Market Metrics.
*   **Simulation Results**: View side-by-side comparisons of "Current vs. Simulated" conditions with explainable AI insights.

### 🧠 Physics-Aware Simulation
Our "Scenario Delta" engine respects physical reality:
*   **Context Awareness**: Distinguishes between "Short" vs. "Prolonged" events.
*   **Real-World Physics**: Floods improve air quality (washout effect) while disrupting logistics; Heatwaves spike Ozone and hospital load.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Python 3.8+
*   Node.js 16+

### 1. Backend Setup
The backend powers the simulation engine, database, and risk models.
```bash
# Install dependencies
pip install -r requirements.txt

# Start the API server
python api/run.py
```
*Server will start at `http://localhost:8000`*

### 2. Frontend Setup
The frontend provides the interactive map and scenario interface.
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*Access the web interface at `http://localhost:5173`*

---

## 📂 Repository Structure

*   **/api**: FastApi backend, simulation logic (`scenario_deltas.py`), and ML models.
*   **/frontend**: React application with Mapbox integration and GSAP animations.
*   **/model**: Risk Engine core logic and data generators.
*   **/scripts**: Utility scripts for data analysis and verification.
*   **/docs**: Documentation and dataset analysis.

---

## 🧪 Quick Test
Once running, try these prompts in the Scenario Chat:
1.  *"Severe flood in Mumbai"* (Observe AQI improvement + Logistics impact)
2.  *"Toxic smog event"* (Observe AQI spike + Health risk)
