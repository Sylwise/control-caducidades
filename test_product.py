import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_create_product():
    # Login
    login_payload = {"username": "Admin", "password": "admin123"}
    print(f"Logging in with {login_payload}...")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return

    token = response.json().get("token")
    print("Login successful. Token obtained.")

    # Create Product
    headers = {"Authorization": f"Bearer {token}"}
    import random
    product_payload = {"nombre": f"Test Product Python {random.randint(1, 1000)}", "tipo": "permanente"}
    
    print(f"Creating product with {product_payload}...")
    response = requests.post(f"{BASE_URL}/catalog", json=product_payload, headers=headers)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_create_product()
