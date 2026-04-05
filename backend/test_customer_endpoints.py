"""
Test script to verify Customer Portal API endpoints are working correctly.
This tests authentication and endpoint accessibility without requiring actual Starlink data.
"""
import httpx
import asyncio
from typing import Dict, Any
from httpx import AsyncClient, Cookies

BASE_URL = "http://localhost:8000/api/v1"

async def test_customer_login_and_endpoints():
    """Test customer login and verify endpoints return proper responses"""
    
    print("=" * 80)
    print("CUSTOMER PORTAL API TEST")
    print("=" * 80)
    
    # Test credentials (replace with your test customer)
    test_email = "test@example.com"
    test_password = "Admin@123456"
    
    # Create a client with cookie persistence
    cookies = Cookies()
    async with httpx.AsyncClient(cookies=cookies, timeout=30.0) as client:
        
        # Step 1: Login
        print("\n1️⃣  Testing Customer Login...")
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                json={"email": test_email, "password": test_password}
            )
            
            if response.status_code == 200:
                print("   ✅ Login successful!")
                print(f"   Response: {response.json()}")
            else:
                print(f"   ❌ Login failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return
                
        except Exception as e:
            print(f"   ❌ Login error: {str(e)}")
            return
        
        # Step 2: Get current user info
        print("\n2️⃣  Testing /auth/me endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/auth/me")
            if response.status_code == 200:
                user_data = response.json()
                print("   ✅ User info retrieved!")
                print(f"   Email: {user_data.get('email')}")
                print(f"   Is Admin: {user_data.get('is_admin')}")
                print(f"   Enterprise: {user_data.get('enterprise_name')}")
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 3: Test Account Info endpoint
        print("\n3️⃣  Testing /customer/starlink/account endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/account")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Endpoint accessible!")
                
                if "message" in data:
                    print(f"   ℹ️  Message: {data['message']}")
                    print("   (This is expected if no Starlink account exists)")
                else:
                    print(f"   Data: {data}")
            elif response.status_code == 401:
                print("   ❌ Unauthorized - Check authentication")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            import traceback
            print(f"   Traceback: {traceback.format_exc()}")
        
        # Step 4: Test Devices endpoint
        print("\n4️⃣  Testing /customer/starlink/devices endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/devices")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Endpoint accessible!")
                
                if "devices" in data:
                    device_count = len(data["devices"])
                    print(f"   📡 Devices found: {device_count}")
                    
                    if device_count == 0:
                        print("   ℹ️  No devices found (expected for new accounts)")
                        if "message" in data:
                            print(f"   Message: {data['message']}")
                    else:
                        print(f"   Devices: {data['devices']}")
                elif "message" in data:
                    print(f"   ℹ️  Message: {data['message']}")
                else:
                    print(f"   Data: {data}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 5: Test Telemetry endpoint
        print("\n5️⃣  Testing /customer/starlink/telemetry endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/telemetry")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Endpoint accessible!")
                
                if "message" in data:
                    print(f"   ℹ️  Message: {data['message']}")
                else:
                    print(f"   Data keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 6: Test Tasks endpoint
        print("\n6️⃣  Testing /customer/starlink/tasks endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/tasks")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Endpoint accessible!")
                data = response.json()
                if "tasks" in data:
                    print(f"   Tasks count: {len(data['tasks'])}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 7: Test Alerts endpoint
        print("\n7️⃣  Testing /customer/starlink/alerts endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/alerts")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Endpoint accessible!")
                data = response.json()
                if "alerts" in data:
                    print(f"   Alerts count: {len(data['alerts'])}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print("\n📝 Notes:")
    print("   - All endpoints should return 200 OK")
    print("   - Empty data is EXPECTED when no Starlink resources exist")
    print("   - Look for '✅ Endpoint accessible!' messages")
    print("   - Messages like 'No devices found' are NORMAL for new accounts")
    print("\n✅ If all endpoints return 200, the API is working correctly!")
    print("❌ If any endpoint returns 500, check the backend logs for errors\n")


if __name__ == "__main__":
    asyncio.run(test_customer_login_and_endpoints())
