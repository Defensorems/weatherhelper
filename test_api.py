from flask import Flask, jsonify
import os
import requests

app = Flask(__name__)

@app.route('/test-weather')
def test_weather():
    api_key = os.environ.get('OPENWEATHERMAP_API_KEY')
    if not api_key:
        return jsonify({"error": "OpenWeatherMap API key not found"})
    
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q=London&appid={api_key}&units=metric"
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200:
            return jsonify({"error": data.get('message', 'Failed to get weather data')})
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/test-eventbrite')
def test_eventbrite():
    token = os.environ.get('EVENTBRITE_TOKEN')
    if not token:
        return jsonify({"error": "Eventbrite token not found"})
    
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        # Test with a simple endpoint
        url = "https://www.eventbriteapi.com/v3/users/me/"
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if response.status_code != 200:
            return jsonify({"error": data.get('error_description', 'Failed to connect to Eventbrite')})
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5001, use_reloader=False)
