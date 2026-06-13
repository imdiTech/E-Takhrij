import requests
url = "http://127.0.0.1:5001/api/admin-api/themes/1/subthemes"
# To test without auth, this will return 401 if auth is working
res = requests.post(url, json={"judul": "Test", "deskripsi": "Test"})
print("Status:", res.status_code)
print("Response:", res.text)
