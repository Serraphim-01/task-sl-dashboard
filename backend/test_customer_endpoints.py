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
        
        # Step 8: Test Account Users endpoint
        print("\n8️⃣  Testing /customer/starlink/account/users endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/account/users")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Endpoint accessible!")
                if "users" in data:
                    print(f"   👥 Users count: {len(data['users'])}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 9: Test Get Device endpoint (using first device ID if available)
        print("\n9️⃣  Testing /customer/starlink/devices/{{device_id}} endpoint...")
        try:
            # First get devices to find a device ID
            devices_response = await client.get(f"{BASE_URL}/customer/starlink/devices")
            if devices_response.status_code == 200:
                devices_data = devices_response.json()
                devices = devices_data.get("devices", [])
                
                if len(devices) > 0:
                    device_id = devices[0].get("id") or devices[0].get("deviceId")
                    if device_id:
                        response = await client.get(f"{BASE_URL}/customer/starlink/devices/{device_id}")
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("   ✅ Endpoint accessible!")
                            print(f"   📡 Device ID: {device_id}")
                        else:
                            print(f"   ⚠️  Status: {response.status_code}")
                    else:
                        print("   ℹ️  Skipped - No device ID found")
                else:
                    print("   ℹ️  Skipped - No devices available to test")
            else:
                print("   ℹ️  Skipped - Could not retrieve devices list")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 10: Test Device Status endpoint
        print("\n🔟 Testing /customer/starlink/devices/{{device_id}}/status endpoint...")
        try:
            devices_response = await client.get(f"{BASE_URL}/customer/starlink/devices")
            if devices_response.status_code == 200:
                devices_data = devices_response.json()
                devices = devices_data.get("devices", [])
                
                if len(devices) > 0:
                    device_id = devices[0].get("id") or devices[0].get("deviceId")
                    if device_id:
                        response = await client.get(f"{BASE_URL}/customer/starlink/devices/{device_id}/status")
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("   ✅ Endpoint accessible!")
                        else:
                            print(f"   ⚠️  Status: {response.status_code}")
                    else:
                        print("   ℹ️  Skipped - No device ID found")
                else:
                    print("   ℹ️  Skipped - No devices available to test")
            else:
                print("   ℹ️  Skipped - Could not retrieve devices list")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 11: Test Device Location endpoint
        print("\n1️⃣1️⃣ Testing /customer/starlink/devices/{{device_id}}/location endpoint...")
        try:
            devices_response = await client.get(f"{BASE_URL}/customer/starlink/devices")
            if devices_response.status_code == 200:
                devices_data = devices_response.json()
                devices = devices_data.get("devices", [])
                
                if len(devices) > 0:
                    device_id = devices[0].get("id") or devices[0].get("deviceId")
                    if device_id:
                        response = await client.get(f"{BASE_URL}/customer/starlink/devices/{device_id}/location")
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("   ✅ Endpoint accessible!")
                        else:
                            print(f"   ⚠️  Status: {response.status_code}")
                    else:
                        print("   ℹ️  Skipped - No device ID found")
                else:
                    print("   ℹ️  Skipped - No devices available to test")
            else:
                print("   ℹ️  Skipped - Could not retrieve devices list")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 12: Test Device Diagnostics endpoint
        print("\n1️⃣2️⃣ Testing /customer/starlink/devices/{{device_id}}/diagnostics endpoint...")
        try:
            devices_response = await client.get(f"{BASE_URL}/customer/starlink/devices")
            if devices_response.status_code == 200:
                devices_data = devices_response.json()
                devices = devices_data.get("devices", [])
                
                if len(devices) > 0:
                    device_id = devices[0].get("id") or devices[0].get("deviceId")
                    if device_id:
                        response = await client.get(f"{BASE_URL}/customer/starlink/devices/{device_id}/diagnostics")
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("   ✅ Endpoint accessible!")
                        else:
                            print(f"   ⚠️  Status: {response.status_code}")
                    else:
                        print("   ℹ️  Skipped - No device ID found")
                else:
                    print("   ℹ️  Skipped - No devices available to test")
            else:
                print("   ℹ️  Skipped - Could not retrieve devices list")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 13: Test Statistics endpoint
        print("\n1️⃣3️⃣ Testing /customer/starlink/statistics endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/customer/starlink/statistics")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Endpoint accessible!")
                if "statistics" in data:
                    print(f"   📊 Statistics entries: {len(data['statistics'])}")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 14: Test Get Task endpoint (using first task ID if available)
        print("\n1️⃣4️⃣ Testing /customer/starlink/tasks/{{task_id}} endpoint...")
        try:
            # First get tasks to find a task ID
            tasks_response = await client.get(f"{BASE_URL}/customer/starlink/tasks")
            if tasks_response.status_code == 200:
                tasks_data = tasks_response.json()
                tasks = tasks_data.get("tasks", [])
                
                if len(tasks) > 0:
                    task_id = tasks[0].get("id") or tasks[0].get("taskId")
                    if task_id:
                        response = await client.get(f"{BASE_URL}/customer/starlink/tasks/{task_id}")
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("   ✅ Endpoint accessible!")
                            print(f"   ⚙️  Task ID: {task_id}")
                        else:
                            print(f"   ⚠️  Status: {response.status_code}")
                    else:
                        print("   ℹ️  Skipped - No task ID found")
                else:
                    print("   ℹ️  Skipped - No tasks available to test")
            else:
                print("   ℹ️  Skipped - Could not retrieve tasks list")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Step 15: Test Network Config endpoint (using first device ID if available)
        print("\n1️⃣5️⃣ Testing /customer/starlink/network/config/{{device_id}} endpoint...")
        try:
            devices_response = await client.get(f"{BASE_URL}/customer/starlink/devices")
            if devices_response.status_code == 200:
                devices_data = devices_response.json()
                devices = devices_data.get("devices", [])
                
                if len(devices) > 0:
                    device_id = devices[0].get("id") or devices[0].get("deviceId")
                    if device_id:
                        response = await client.get(f"{BASE_URL}/customer/starlink/network/config/{device_id}")
                        print(f"   Status Code: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("   ✅ Endpoint accessible!")
                        else:
                            print(f"   ⚠️  Status: {response.status_code}")
                    else:
                        print("   ℹ️  Skipped - No device ID found")
                else:
                    print("   ℹ️  Skipped - No devices available to test")
            else:
                print("   ℹ️  Skipped - Could not retrieve devices list")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print("\n📝 Summary:")
    print("   - Tested all 15 frontend-implemented endpoints")
    print("   - All endpoints should return 200 OK")
    print("   - Empty data is EXPECTED when no Starlink resources exist")
    print("   - Look for '✅ Endpoint accessible!' messages")
    print("   - Messages like 'No devices found' are NORMAL for new accounts")
    print("\n✅ If all endpoints return 200, the API is working correctly!")
    print("❌ If any endpoint returns 500, check the backend logs for errors\n")


if __name__ == "__main__":
    asyncio.run(test_customer_login_and_endpoints())
