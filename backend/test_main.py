import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import pandas as pd
import json

# Import the app. 
# Note: We wrap this in a try/except or mock the initial data load 
# if the CSV doesn't exist in the test environment.
import main 

client = TestClient(main.app)

# --- FIXTURES: MOCK DATA ASSETS ---
# In a government hackathon, reproducibility is key. 
# We mock the dataset so tests pass regardless of the local file system.

@pytest.fixture
def mock_uidai_data():
    """
    Creates a synthetic DataFrame mimicking the official schema.
    Used to verify the 'Studio' logic receives correct formats.
    """
    data = {
        "district": ["District_A", "District_B", "District_C"],
        "date": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "total_updates": [100, 200, 150],
        "total_enrolment": [50, 60, 55],
        "age_0_5": [10, 20, 15],
        "age_5_17": [30, 40, 35],
        "age_18_greater": [60, 140, 100]
    }
    return pd.DataFrame(data)

# --- TEST CATEGORY 1: INFRASTRUCTURE INTEGRITY ---

def test_system_health():
    """
    Verifies the API is reachable. 
    Audit Req: System must acknowledge status requests.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "Online", "system": "Aadhaar Drishti Command Center"}

# --- TEST CATEGORY 2: DATA INTEGRITY & STUDIO LOGIC ---

def test_summary_data_structure(mock_uidai_data):
    """
    CRITICAL: Validates that data served to the Frontend Studio 
    contains all required dimensions for the Pivot Engine.
    """
    # 1. Inject the mock data into the main application state
    with patch.object(main, 'df', mock_uidai_data):
        response = client.get("/api/summary")
        
        # 2. Assert Success
        assert response.status_code == 200
        data = response.json()
        
        # 3. Assert Data Integrity (The "Contract" with the Frontend)
        assert len(data) == 3
        first_record = data[0]
        
        # Ensure keys required by App.jsx exist
        required_keys = ["district", "total_updates", "age_0_5"]
        for key in required_keys:
            assert key in first_record, f"Missing critical dimension: {key}"
        
        # 4. Statistical Sanity Check (Audit Requirement)
        # Updates cannot be negative
        assert first_record["total_updates"] >= 0 

def test_summary_failure_mode():
    """
    Verifies behavior when the database is offline.
    Government systems must fail safely, not crash.
    """
    with patch.object(main, 'df', None):
        response = client.get("/api/summary")
        assert response.status_code == 500
        assert "Database not loaded" in response.json()["detail"]

# --- TEST CATEGORY 3: AI GOVERNANCE LAYER ---

def test_ai_interpretation_success():
    """
    Tests the Strategic Briefing generation.
    Mocks the Gemini API to avoid costs and network dependency during CI/CD.
    """
    # Define the payload expected by the frontend
    payload = {
        "volume": "1.5M",
        "model": "XGBoost",
        "avg": "1.0M",
        "confidence": "99%"
    }

    # Mock the Google GenAI Client
    with patch('main.client') as mock_client:
        # Setup the mock response object
        mock_response = MagicMock()
        mock_response.text = "Operational surge detected. Recommend increasing staff."
        
        # Configure the generate_content method to return our mock
        mock_client.models.generate_content.return_value = mock_response

        # Make the request
        response = client.post("/api/ai-interpret", json=payload)
        
        # Assertions
        assert response.status_code == 200
        assert response.json()["interpretation"] == "Operational surge detected. Recommend increasing staff."
        
        # Verify the prompt was actually sent (Audit Trail)
        mock_client.models.generate_content.assert_called_once()

def test_ai_interpretation_failure_handling():
    """
    Ensures that if the AI provider is down, the dashboard 
    shows a polite fallback message instead of a code error.
    """
    payload = {"volume": "0", "model": "Test", "avg": "0", "confidence": "0"}

    with patch('main.client') as mock_client:
        # Simulate an API Crash
        mock_client.models.generate_content.side_effect = Exception("API Overload")

        response = client.post("/api/ai-interpret", json=payload)
        
        assert response.status_code == 200
        # Must return the fallback message defined in main.py
        assert "currently unavailable" in response.json()["interpretation"]