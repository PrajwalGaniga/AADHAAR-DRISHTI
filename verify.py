import requests
import json
import os

# --- CONFIGURATION ---
BASE_URL = "https://aadhaar-drishti.onrender.com"
ENDPOINTS = [
    "/",
    "/api/summary",
    "/api/governance-indices",
    "/api/model-comparison"
]

def verify_system():
    print("🏛️  AADHAAR DRISHTI: SYSTEM DIAGNOSTIC STARTING...")
    print("-" * 50)

    # 1. Check Directory Structure
    print(f"📁 [DIR] Local Root: {os.getcwd()}")
    for folder in ['backend', 'frontend', 'backend/data', 'backend/models']:
        exists = "✅ EXISTS" if os.path.exists(folder) else "❌ MISSING"
        print(f"   {folder.ljust(15)}: {exists}")

    # 2. Check API Connection & CORS Headers
    print("\n📡 [API] Testing Production Endpoints:")
    for ep in ENDPOINTS:
        url = f"{BASE_URL}{ep}"
        try:
            # We send an OPTIONS request to simulate what the browser does (CORS check)
            response = requests.options(url)
            cors_ok = "✅ CORS OK" if "*" in response.headers.get('Access-Control-Allow-Origin', '') or "netlify" in response.headers.get('Access-Control-Allow-Origin', '') else "⚠️ CORS RESTRICTED"
            
            # Now get the actual data
            res = requests.get(url)
            status = f"HTTP {res.status_code}"
            
            # Check for data payload
            data_preview = "N/A"
            if res.status_code == 200:
                data = res.json()
                if isinstance(data, list):
                    data_preview = f"{len(data)} records found"
                elif isinstance(data, dict):
                    data_preview = "Valid JSON Object"

            print(f"   {ep.ljust(25)}: {status} | {cors_ok} | Data: {data_preview}")
            
            if "Feature Engineering Error" in str(res.text):
                print(f"   🚨 ALERT: Model Loading Error detected in {ep}")

        except Exception as e:
            print(f"   {ep.ljust(25)}: ❌ FAILED - {str(e)[:50]}")

    # 3. Check for specific common deployment killer
    print("\n🧐 [CHECK] SSL/Protocol Verification:")
    if not BASE_URL.startswith("https"):
        print("   ❌ WARNING: Using 'http' instead of 'https'. Netlify WILL block this.")
    else:
        print("   ✅ HTTPS Protocol confirmed.")

    print("-" * 50)
    print("🏁 DIAGNOSTIC COMPLETE. PLEASE PASTE THE OUTPUT BELOW.")

if __name__ == "__main__":
    verify_system()