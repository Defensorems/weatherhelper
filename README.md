# Weather & Events Explorer

![Weather & Events Explorer](https://placeholder.svg?height=300&width=800)

## 🌦️ Overview

Weather & Events Explorer is a comprehensive web application that provides real-time weather data, air quality information, local events, and interactive maps for any location worldwide. Built with Flask, JavaScript, and modern web technologies, it offers a seamless user experience with a responsive design and intuitive interface.

## ✨ Features

- **Real-time Weather Data**: Get current weather conditions including temperature, humidity, wind speed, and more
- **5-Day Weather Forecast**: Plan ahead with detailed weather predictions
- **Air Quality Information**: Monitor air quality index (AQI) and pollutant concentrations
- **Local Events**: Discover events happening in your area
- **Interactive Maps**: Explore locations with detailed mapping
- **Location Search**: Find any city with autocomplete suggestions
- **Geolocation**: Use your current location for instant weather updates
- **Favorites**: Save your frequently checked locations
- **Dark/Light Mode**: Choose your preferred theme
- **Metric/Imperial Units**: Switch between measurement systems
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Data Visualization**: Charts for temperature trends and air quality metrics

## 🛠️ Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **CSS Framework**: Tailwind CSS
- **Maps**: Leaflet.js
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **APIs**:
  - OpenWeatherMap (weather data)
  - IQAir (air quality)
  - Ticketmaster (events)

## 📋 Prerequisites

- Python 3.7+
- API keys for:
  - OpenWeatherMap
  - IQAir
  - Ticketmaster

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/weather-events-explorer.git
   cd weather-events-explorer
   ```


2. Create and activate a virtual environment:
```plaintext
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```plaintext
pip install -r requirements.txt
```

4. Create a `.env` file in the project root and add your API keys:
```plaintext
WEATHER_API_KEY=your_openweathermap_api_key
AIR_QUALITY_API_KEY=your_iqair_api_key
EVENTS_API_KEY=your_ticketmaster_api_key
```

5. Run the application:
```plaintext
python app.py
```

6. Open your browser and navigate to `http://localhost:5000`

## 🔧 Configuration

You can modify the following settings in the `app.py` file:

- Default units (metric/imperial)
- API endpoints
- Logging level

## 📱 Usage

1. **Search for a location**: Enter a city name in the search bar
2. **Use current location**: Click the "Use my location" button
3. **View weather details**: See current conditions and forecast
4. **Check air quality**: View AQI and pollutant information
5. **Explore events**: Discover local happenings
6. **Save favorites**: Star locations for quick access
7. **Share**: Generate shareable links for specific locations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
```
