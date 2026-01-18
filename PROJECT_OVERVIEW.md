# Urban Intelligence Platform: Project Overview

## 1. Problem Statement

**The Gap in Urban Resilience Planning**
Cities today face compounding risks—floods, heatwaves, and pollution events—that do not happen in isolation. Policymakers, emergency planners, and urban administrators currently rely on fragmented, static dashboards that show *what happened yesterday* or *what is happening now*, but fail to answer *what happens next*.

**Current Solutions Are Insufficient**
*   **Static Reports:** Outdated by the time they are published.
*   **Siloed Dashboards:** Air quality, health, and food supply are tracked separately, missing the critical "domino effects" (e.g., how a flood triggers a health crisis).
*   **Lack of Actionable Intelligence:** Knowing AQI is 300 is useful; knowing *how* a proposed mitigation strategy changes that number is critical.

**Our Explicit Value Proposition**
We bridge the gap between raw data and decision-making. We move beyond visualization to **Scenario Simulation**. Our platform enables decision-makers to ask "What if?" questions in natural language and receive scientifically grounded, explainable predictions about cascading risks, transforming data into decision-grade intelligence.

---

## 2. Our Approach: The "Live-to-Simulation" Pipeline

Our system operates on a rigorous, physics-aware pipeline that ensures credibility:

1.  **Real-Time Baseline (The "Now")**
    *   We ingest live data streams (Air Quality, Weather, Market Prices, Hospital Load) to establish a hyper-local baseline.
    *   **Geospatial Context**: Integrated interactive maps visualize risk distribution across the city, providing immediate spatial context.
    *   **Trend Analysis**: 24-hour historical rolling windows reveal emerging patterns and volatility before they escalate into crises.
    *   Strict data freshness protocols ensure simulations are built on *current* reality, not historical averages.

2.  **Natural Language Scenario Inference**
    *   Users interact via simple prompts (e.g., "Severe flood in Mumbai for 2 weeks").
    *   **Context-Aware Analysis**: The system parses severity ("severe") and duration ("2 weeks") to dynamically adjust simulation parameters.
    *   **Physics-Based Deltas**: Unlike generic models, our logic respects physical realities (e.g., floods *improve* AQI via washout, but severely impact logistics).

3.  **Cascading Risk Simulation**
    *   Inferred deltas are applied to the baseline to create a "Simulated State".
    *   **Probabilistic ML Models**: We use explainable ML models to predict risks across three connected domains:
        *   **Environmental**: AQI, Temperature, Traffic.
        *   **Public Health**: Respiratory risk, Hospital capacity.
        *   **Food Security**: Supply chain disruption, Price stability.

4.  **Resilience Scoring & Explainability**
    *   The system aggregates these risks into a single **Resilience Score** (0-100).
    *   Crucially, every prediction comes with **Causal Explanations** (e.g., "Resilience dropped due to compounded hospital load and supply chain failure"), ensuring transparency for stakeholders.

---

## 3. Technology Stack

### Frontend: Interactive & Responsive
*   **React.js**: Chosen for component-based architecture and state management.
*   **Interactive Maps**: Geospatial integration allows users to pinpoint risks in specific urban zones.
*   **Time-Series Visualization**: Trend components track 24-hour performance for granular analysis.
*   **GSAP (GreenSock)**: Powers smooth, high-performance animations.
*   **CSS Variables / Modern Layouts**: Ensures a responsive design.

### Backend: Performance & Intelligence
*   **FastAPI (Python)**: Selected for its high performance (async capabilities) and automatic validation (Pydantic). It handles concurrent simulation requests with minimal latency.
*   **SQLAlchemy**: Robust ORM for managing city metrics and historical data reliability.
*   **REST Architecture**: Decoupled endpoints (e.g., `/current-state`, `/scenario-delta`) allow for independent scaling of data ingestion and simulation compute.

### Data & Machine Learning: Explainable AI
*   **Probabilistic Risk Engine**: Custom Python-based engine that prioritizes **interpretability**. Instead of "black box" deep learning, we use transparent probabilistic weightings and heuristics derived from domain expertise.
*   **Dynamic Context Logic (NLP)**: Regex-based context extraction ensures robust handling of user prompts without the latency or hallucination risks of large LLMs for core logic.
*   **Real-Time Data Simulators**: Validated simulation modules fill in data gaps where live sensors are unavailable, ensuring system availability.

### Integration
*   **Loose Coupling**: The ML inference engine is decoupled from the API layer, allowing us to update risk models without downtime.
*   **Strict Typing (Pydantic)**: Enforced throughout the stack to prevent "garbage in, garbage out"—critical for public sector reliability.
