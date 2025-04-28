import requests
import logging

logger = logging.getLogger(__name__)

def get_air_quality(city, state=None, country=None):
    """
    Get air quality data for a location using AirVisual API
    
    Args:
        city (str): City name
        state (str, optional): State name
        country (str, optional): Country name (default: None)
        
    Returns:
        dict: Air quality data or error message
    """
    try:
        # You would need to get an API key from https://www.iqair.com/air-pollution-data-api
        api_key = "e864be35-99e4-4415-b6f0-a6ca9241d436"  # Replace with environment variable in production
        
        # Build URL based on available parameters
        base_url = "http://api.airvisual.com/v2/city"
        params = {
            'city': city,
            'key': api_key
        }
        
        if state:
            params['state'] = state
        
        if country:
            params['country'] = country
        else:
            # Default to a country if none provided
            params['country'] = 'USA'
        
        logger.info(f"Fetching air quality data for {city}")
        response = requests.get(base_url, params=params)
        
        if response.status_code != 200:
            logger.error(f"Air quality API error: {response.text}")
            return {'error': 'Failed to get air quality data'}
        
        data = response.json()
        
        if data['status'] != 'success':
            logger.error(f"Air quality API returned error: {data}")
            return {'error': data.get('data', 'Unknown error')}
        
        # Extract the relevant air quality information
        pollution = data['data']['current']['pollution']
        weather = data['data']['current']['weather']
        
        result = {
            'aqi': pollution['aqius'],  # US AQI
            'main_pollutant': pollution['mainus'],
            'category': get_aqi_category(pollution['aqius']),
            'temperature': weather['tp'],  # Temperature in Celsius
            'humidity': weather['hu'],  # Humidity %
            'wind_speed': weather['ws'],  # Wind speed (m/s)
            'timestamp': pollution['ts']  # Timestamp
        }
        
        logger.info(f"Successfully retrieved air quality for {city}")
        return result
        
    except Exception as e:
        logger.error(f"Error in get_air_quality: {str(e)}")
        return {'error': 'An unexpected error occurred'}

def get_aqi_category(aqi):
    """
    Get the air quality category based on AQI value
    
    Args:
        aqi (int): Air Quality Index value
        
    Returns:
        dict: Category information including name, description and color
    """
    if aqi <= 50:
        return {
            'name': 'Good',
            'description': 'Air quality is satisfactory, and air pollution poses little or no risk.',
            'color': 'green'
        }
    elif aqi <= 100:
        return {
            'name': 'Moderate',
            'description': 'Air quality is acceptable. However, there may be a risk for some people.',
            'color': 'yellow'
        }
    elif aqi <= 150:
        return {
            'name': 'Unhealthy for Sensitive Groups',
            'description': 'Members of sensitive groups may experience health effects.',
            'color': 'orange'
        }
    elif aqi <= 200:
        return {
            'name': 'Unhealthy',
            'description': 'Some members of the general public may experience health effects.',
            'color': 'red'
        }
    elif aqi <= 300:
        return {
            'name': 'Very Unhealthy',
            'description': 'Health alert: The risk of health effects is increased for everyone.',
            'color': 'purple'
        }
    else:
        return {
            'name': 'Hazardous',
            'description': 'Health warning of emergency conditions. Everyone is more likely to be affected.',
            'color': 'maroon'
        }
