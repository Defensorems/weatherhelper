from flask import Flask, request, jsonify, render_template
import logging
import os
import requests

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API Keys (replace with your actual keys or environment variables)
WEATHER_API_KEY = '6c9f3821ef0b33dd01dedbd5cd162454'
EVENTS_API_KEY = 'GP2BW3D7YRTLCPXVONQM'
AIR_QUALITY_API_KEY = 'e864be35-99e4-4415-b6f0-a6ca9241d436'
IQAIR_API_KEY = 'e864be35-99e4-4415-b6f0-a6ca9241d436'
IQAIR_BASE_URL = "http://api.airvisual.com/v2/nearest_city"

@app.route('/', methods=['GET'])
def home():
    """Отдаёт главную HTML-страницу."""
    return render_template('index.html')

@app.route('/autocomplete', methods=['POST'])
def autocomplete():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if len(query) < 2:
            return jsonify([])

        url = f"http://api.openweathermap.org/geo/1.0/direct?q={query}&limit=5&appid={WEATHER_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        
        locations = []
        for loc in response.json():
            location = {
                "name": f"{loc['name']}, {loc.get('state', loc['country'])}",
                "lat": loc['lat'],
                "lon": loc['lon']
            }
            locations.append(location)
            
        return jsonify(locations)

    except Exception as e:
        logger.error(f"Autocomplete error: {str(e)}")
        return jsonify([])

# Helper Functions for API calls
def get_weather(location, units='metric'):
    """Fetch weather data from OpenWeatherMap API."""
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={WEATHER_API_KEY}&units={units}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        main_data = data.get('main', {})
        wind_data = data.get('wind', {})
        
        weather_data = {
            'city': data.get('name', 'N/A'),
            'temp': main_data.get('temp'),
            'temp_min': main_data.get('temp_min'),
            'temp_max': main_data.get('temp_max'),
            'feels_like': main_data.get('feels_like'),
            'pressure': main_data.get('pressure'),
            'humidity': main_data.get('humidity'),
            'visibility': data.get('visibility'),
            'wind_speed': wind_data.get('speed'),
            'wind_deg': wind_data.get('deg'),
            'description': data.get('weather', [{}])[0].get('description', 'N/A'),
            'icon': data.get('weather', [{}])[0].get('icon', '02d'),
            'lat': data.get('coord', {}).get('lat'),
            'lon': data.get('coord', {}).get('lon')
        }
        return weather_data
    except Exception as e:
        logger.error(f"Error in get_weather: {str(e)}")
        return {'error': str(e)}

@app.route('/reverse-geocode', methods=['GET'])
def reverse_geocode():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({'error': 'lat и lon обязательны'}), 400
    try:
        url = (f"http://api.openweathermap.org/geo/1.0/reverse"
               f"?lat={lat}&lon={lon}&limit=1&appid={WEATHER_API_KEY}")
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return jsonify({'error': 'Ничего не найдено'}), 404
        # Возвращаем название города и страны
        place = data[0]
        return jsonify({
            'city': place.get('name'),
            'country': place.get('country')
        })
    except requests.RequestException as e:
        logger.error(f"Reverse geocode error: {e}")
        return jsonify({'error': 'Ошибка при запросе геокодинга'}), 500

def get_forecast(lat, lon, units='metric'):
    """Fetch weather forecast data from OpenWeatherMap API."""
    try:
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units={units}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        forecast_list = []
        for item in data['list'][::8]:  # Берем по одному прогнозу в день (каждые 24 часа)
            forecast_list.append({
                'date': item['dt'] * 1000,  # Конвертируем в миллисекунды для JS
                'temp': item['main']['temp'],
                'description': item['weather'][0]['description'],
                'icon': item['weather'][0]['icon'],
                'humidity': item['main']['humidity'],
                'wind_speed': item['wind']['speed']
            })
            if len(forecast_list) >= 5:  # Ограничиваем 5 днями
                break
                
        return forecast_list
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        return {'error': 'Failed to fetch forecast'}

def get_air_quality(lat, lon):
    """Fetch air quality data from IQAir API."""
    try:
        params = {
            'lat': lat,
            'lon': lon,
            'key': IQAIR_API_KEY
        }
        
        response = requests.get(IQAIR_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Проверка структуры ответа
        if data.get('status') != 'success':
            raise ValueError("Invalid API response")

        current = data.get('data', {}).get('current', {})
        pollution = current.get('pollution', {})
        weather = current.get('weather', {})
        
        # Уровни AQI и рекомендации
        aqi_levels = {
            1: {"label": "Хорошо", "color": "bg-green-500", "advice": "Идеально для outdoor-активностей"},
            2: {"label": "Умеренно", "color": "bg-yellow-500", "advice": "Приемлемо для большинства"},
            3: {"label": "Нездорово", "color": "bg-orange-500", "advice": "Ограничьте пребывание на улице"},
            4: {"label": "Опасно", "color": "bg-red-500", "advice": "Избегайте outdoor-активностей"},
            5: {"label": "Очень опасно", "color": "bg-purple-500", "advice": "Оставайтесь дома"}
        }
        
        return {
            'aqi': pollution.get('aqius', 0),
            'level': aqi_levels.get((pollution.get('aqius', 0) // 50) + 1, aqi_levels[1]),
            'temperature': weather.get('tp', 0),
            'humidity': weather.get('hu', 0),
            'pressure': weather.get('pr', 0),
            'wind_speed': weather.get('ws', 0),
            'dominant_pollutant': pollution.get('mainus', 'N/A'),
            'timestamp': current.get('ts', '')
        }
        
    except Exception as e:
        logger.error(f"IQAir API error: {str(e)}")
        return {'error': 'Не удалось получить данные о качестве воздуха'}

def get_events(location):
    """Fetch event data from Ticketmaster API."""
    try:
        url = f"https://app.ticketmaster.com/discovery/v2/events.json?apikey={EVENTS_API_KEY}&city={location}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant event information
        events = []
        if '_embedded' in data and 'events' in data['_embedded']:
            for event in data['_embedded']['events']:
                events.append({
                    'name': event['name'],
                    'url': event['url'],
                    'dates': event['dates']
                })
        return events
    except requests.exceptions.RequestException as e:
        logger.error(f"Events API request failed: {e}")
        return []
    except (KeyError, TypeError) as e:
        logger.error(f"Error processing events API response: {e}")
        return []
    return {}

@app.route('/search', methods=['POST'])
def search():
    """Handle search requests for weather and events"""
    try:
        # Get location from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        location = data.get('location')
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        units = data.get('units', 'metric')  # Default to metric
        
        logger.info(f"Searching for location: {location} with units: {units}")
        
        # Инициализируем результаты
        result = {}
        
        # Получаем данные о погоде
        try:
            weather_data = get_weather(location, units)
            # Добавляем иконку в результат
            result['weather'] = {
                **weather_data,
                'temp': weather_data.get('temp'),
                'icon': weather_data.get('icon', '02d')
            }
            
            # Если получили координаты, запрашиваем дополнительные данные
            if 'lat' in weather_data and 'lon' in weather_data and 'error' not in weather_data:
                # Получаем данные о прогнозе
                try:
                    forecast_data = get_forecast(weather_data['lat'], weather_data['lon'], units)
                    result['forecast'] = forecast_data
                except Exception as e:
                    logger.error(f"Error getting forecast data: {str(e)}")
                    result['forecast'] = {'error': 'Failed to get forecast data'}

                try:
                    air_quality_data = get_air_quality(weather_data['lat'], weather_data['lon'])
                    
                    # Добавляем метеопараметры
                    air_quality_data.update({
                        'temperature': weather_data.get('temp'),
                        'humidity': weather_data.get('humidity'),
                        'wind_speed': weather_data.get('wind_speed')
                    })
                    
                    result['air_quality'] = air_quality_data
                except Exception as e:
                    logger.error(f"Error getting air quality data: {str(e)}")
                    result['air_quality'] = {'error': 'Ошибка получения данных'}
        except Exception as e:
            logger.error(f"Error getting weather data: {str(e)}")
            result['weather'] = {'error': 'Failed to get weather data'}
        
        # Получаем данные о событиях независимо от других API
        try:
            events_data = get_events(location)
            result['events'] = events_data
        except Exception as e:
            logger.error(f"Error getting events data: {str(e)}")
            result['events'] = []
        
        # Если нет данных о погоде и есть общая ошибка, возвращаем ошибку
        if 'weather' not in result or ('error' in result['weather'] and len(result) == 1):
            return jsonify({'error': result.get('weather', {}).get('error', 'Failed to get data')}), 400
        
        # Return combined results
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in search endpoint: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

# Создаем функцию для запуска приложения
def run_app():
    app.run(debug=True, use_reloader=False)

# Это стандартный способ запуска Flask-приложения
if __name__ == '__main__':
    run_app()
