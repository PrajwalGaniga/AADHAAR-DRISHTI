# Aadhaar Drishti: National Lifecycle Intelligence Command
### UIDAI Hackathon 2025 | Official Submission

**Theme:** Data-Driven Innovation for Aadhaar
**Role:** Policy Decision Support System
**Status:** ✅ Automated Audit Passed (Pytest Suite)

---

## 🏛️ Executive Summary
**Aadhaar Drishti** is a "Glass-Box" Analytics Dashboard designed for the UIDAI technical committee. Unlike standard visualization tools, it integrates **Explainable AI (XAI)** to translate complex predictive models into plain-language administrative briefings. 

It specifically addresses **Evaluation Criteria 5 (Impact)** by shifting focus from "showing data" to "supporting decisions" regarding:
1. **Infrastructure Scaling:** Predicting enrolment center loads using XGBoost.
2. **Demographic Risk:** Identifying age bands with lagging biometric updates.
3. **Operational Efficiency:** Comparing "Live Nodes" vs "Data Velocity".

---

## 🏗️ Architectural Decisions (Evaluation Criteria 3)

### 1. The "Universal Data Studio"
* **Innovation:** Instead of static charts, we built a dynamic Pivot Engine allowing administrators to correlate any dimension (District/Age) against any metric (Updates/Enrolments).
* **Tech Stack:** React Recharts + Dynamic JSON parsing.

### 2. The "Predictive Duel" Engine
* **Transparency:** We explicitly compare **Random Forest** vs **XGBoost** side-by-side.
* **Governance:** The system defaults to the model with higher *stability*, not just higher *accuracy*, aligning with government risk aversion.

### 3. AI Governance Layer
* **Safety:** The system uses a strict "Human-in-the-Loop" design. The Gemini 2.0 Flash model interprets statistical confidence intervals into text briefings but *cannot* execute database writes.
* **Fallback:** The system includes a "Circuit Breaker" pattern; if the AI is offline, the dashboard degrades gracefully without crashing.

---

## 🚀 Installation & Reproducibility

### Prerequisites
* Python 3.10+
* Node.js 16+
* Google Gemini API Key

### 1. Backend Setup (API & Logic)
```bash
cd backend
pip install -r requirements.txt

# Run the Audit Suite (Verifies logic integrity)
pytest test_main.py -v

# Start the Server
python main.py