//import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchBtn = document.getElementById("searchBtn")
    const locationInput = document.getElementById("location")
    const loadingDiv = document.getElementById("loading")
    const errorDiv = document.getElementById("error")
    const resultsDiv = document.getElementById("results")
    const weatherContent = document.getElementById("weather-content")
    const airQualityContent = document.getElementById("air-quality-content")
    const eventsContent = document.getElementById("events-content")
    const eventsPreviewContent = document.getElementById("events-preview-content")
    const noEventsDiv = document.getElementById("no-events")
    const noEventsPreviewDiv = document.getElementById("no-events-preview")
    const locationTitle = document.getElementById("location-title")
    const favoriteBtn = document.getElementById("favorite-location")
    const shareBtn = document.getElementById("share-location")
    const shareModal = document.getElementById("share-modal")
    const closeShareModal = document.getElementById("close-share-modal")
    const shareUrl = document.getElementById("share-url")
    const copyUrlBtn = document.getElementById("copy-url")
    const themeToggle = document.getElementById("theme-toggle")
    const metricToggle = document.getElementById("metric-toggle")
    const imperialToggle = document.getElementById("imperial-toggle")
    const geolocateBtn = document.getElementById("geolocate-btn")
    const favoritesBtn = document.getElementById("favorites-btn")
    const favoritesList = document.getElementById("favorites-list")
    const autocompleteResults = document.getElementById("autocomplete-results")
    const tabButtons = document.querySelectorAll(".tab-button")
    const tabContents = document.querySelectorAll(".tab-content")
    const viewFullForecast = document.getElementById("view-full-forecast")
    const viewAllEvents = document.getElementById("view-all-events")
    const viewFullMap = document.getElementById("view-full-map")
    const eventFilterBtns = document.querySelectorAll(".event-filter-btn")
    const eventSearch = document.getElementById("event-search")
    const mapStyleStreet = document.getElementById("map-style-street")
    const mapStyleSatellite = document.getElementById("map-style-satellite")
    const showPoi = document.getElementById("show-poi")

    // Maps
    const mapSection = document.getElementById("map-section")
    let map = null
    let mapFull = null
    let marker = null
    let markerFull = null

    // State
    let currentUnits = "metric"
    let currentLocation = ""
    let currentWeatherData = null
    let currentAirQualityData = null
    let currentEventsData = null
    let currentForecastData = null
    let temperatureChart = null
    let pollutantsChart = null
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]")

    // Initialize
    initTheme()
    updateFavoritesList()

    // Event Listeners
    if (searchBtn) {
        searchBtn.addEventListener("click", searchLocation)
    }

    if (locationInput) {
        locationInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                searchLocation()
            }
        })

        locationInput.addEventListener("input", handleAutocomplete)
    }

    if (favoriteBtn) {
        favoriteBtn.addEventListener("click", toggleFavorite)
    }

    if (shareBtn) {
        shareBtn.addEventListener("click", openShareModal)
    }

    if (closeShareModal) {
        closeShareModal.addEventListener("click", closeShareModalHandler)
    }

    if (copyUrlBtn) {
        copyUrlBtn.addEventListener("click", copyShareUrl)
    }

    if (themeToggle) {
        themeToggle.addEventListener("change", toggleTheme)
    }

    if (metricToggle) {
        metricToggle.addEventListener("click", () => {
            setUnits("metric")
        })
    }

    if (imperialToggle) {
        imperialToggle.addEventListener("click", () => {
            setUnits("imperial")
        })
    }

    if (geolocateBtn) {
        geolocateBtn.addEventListener("click", getUserLocation)
    }

    if (favoritesBtn) {
        favoritesBtn.addEventListener("click", toggleFavoritesList)
    }

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tab = button.dataset.tab
            switchTab(tab)
        })
    })

    if (viewFullForecast) {
        viewFullForecast.addEventListener("click", () => {
            switchTab("forecast")
        })
    }

    if (viewAllEvents) {
        viewAllEvents.addEventListener("click", () => {
            switchTab("events-tab")
        })
    }

    if (viewFullMap) {
        viewFullMap.addEventListener("click", () => {
            switchTab("map-tab")
        })
    }

    eventFilterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter
            filterEvents(filter)

            // Update active state
            eventFilterBtns.forEach((b) => b.classList.remove("active"))
            btn.classList.add("active")
        })
    })

    if (eventSearch) {
        eventSearch.addEventListener("input", searchEvents)
    }

    if (mapStyleStreet) {
        mapStyleStreet.addEventListener("click", () => {
            setMapStyle("street")
            mapStyleStreet.classList.add("bg-blue-500", "text-white")
            mapStyleStreet.classList.remove("bg-gray-200", "text-gray-800")
            mapStyleSatellite.classList.add("bg-gray-200", "text-gray-800")
            mapStyleSatellite.classList.remove("bg-blue-500", "text-white")
        })
    }

    if (mapStyleSatellite) {
        mapStyleSatellite.addEventListener("click", () => {
            setMapStyle("satellite")
            mapStyleSatellite.classList.add("bg-blue-500", "text-white")
            mapStyleSatellite.classList.remove("bg-gray-200", "text-gray-800")
            mapStyleStreet.classList.add("bg-gray-200", "text-gray-800")
            mapStyleStreet.classList.remove("bg-blue-500", "text-white")
        })
    }

    if (showPoi) {
        showPoi.addEventListener("change", togglePointsOfInterest)
    }

    // Functions

    function searchLocation() {
        const location = locationInput.value.trim()

        if (!location) {
            showError("Пожалуйста, введите местоположение для поиска")
            return
        }

        currentLocation = location

        // Show loading, hide results and error
        loadingDiv.classList.remove("hidden")
        errorDiv.classList.add("hidden")
        resultsDiv.classList.add("hidden")

        // Make API request to Flask backend
        fetch("/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: location,
                units: currentUnits,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                loadingDiv.classList.add("hidden")

                if (data.error && !data.weather) {
                    showError(data.error)
                    return
                }

                // Обработка данных о погоде
                if (data.weather && !data.weather.error) {
                    // Сохраняем данные в состоянии
                    currentWeatherData = data.weather

                    // Обновляем заголовок с местоположением
                    locationTitle.textContent = `${data.weather.city}, ${data.weather.country}`

                    // Обновляем кнопку избранного
                    updateFavoriteButton()

                    // Отображаем данные о погоде
                    displayWeather(data.weather)

                    // Отображаем карту, если координаты доступны
                    if (data.weather.lat && data.weather.lon) {
                        displayMap(data.weather.lat, data.weather.lon, data.weather.city, data.weather)
                        displayFullMap(data.weather.lat, data.weather.lon, data.weather.city, data.weather)
                    } else {
                        mapSection.classList.add("hidden")
                    }
                } else {
                    // Показываем ошибку для погоды
                    const weatherContent = document.getElementById("weather-content")
                    if (weatherContent) {
                        weatherContent.innerHTML = `
        <div class="flex items-center justify-center h-32">
          <p class="text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>Не удалось получить данные о погоде</p>
        </div>
      `
                    }
                }

                // Обработка данных о качестве воздуха
                if (data.air_quality && !data.air_quality.error) {
                    currentAirQualityData = data.air_quality
                    displayAirQuality(data.air_quality)
                    document.getElementById("air-quality").classList.remove("hidden")
                } else {
                    document.getElementById("air-quality").classList.add("hidden")
                }

                // Обработка данных о прогнозе
                if (data.forecast && !data.forecast.error && Array.isArray(data.forecast)) {
                    currentForecastData = data.forecast
                    displayForecastPreview(data.forecast)
                    displayDetailedForecast(data.forecast)
                } else {
                    const forecastCards = document.getElementById("forecast-cards")
                    if (forecastCards) {
                        forecastCards.innerHTML = `
        <div class="col-span-5 flex items-center justify-center h-32">
          <p class="text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>Не удалось получить данные о прогнозе</p>
        </div>
      `
                    }
                }

                // Обработка данных о событиях
                if (data.events && Array.isArray(data.events)) {
                    currentEventsData = data.events
                    displayEvents(data.events)
                    displayEventsPreview(data.events)
                } else {
                    // Показываем сообщение об ошибке для событий
                    const eventsContent = document.getElementById("events-content")
                    const eventsPreviewContent = document.getElementById("events-preview-content")

                    if (eventsContent) {
                        eventsContent.innerHTML = `
        <div class="flex items-center justify-center h-32">
          <p class="text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>Не удалось получить данные о событиях</p>
        </div>
      `
                    }

                    if (eventsPreviewContent) {
                        eventsPreviewContent.innerHTML = `
        <div class="flex items-center justify-center h-32">
          <p class="text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>Не удалось получить данные о событиях</p>
        </div>
      `
                    }

                    noEventsDiv.classList.add("hidden")
                    noEventsPreviewDiv.classList.add("hidden")
                }

                // Показываем результаты с анимацией
                resultsDiv.classList.remove("hidden")
                resultsDiv.classList.add("fade-in")

                // Переключаемся на вкладку обзора
                switchTab("overview")
            })
            .catch((error) => {
                loadingDiv.classList.add("hidden")
                showError("Произошла ошибка при получении данных. Пожалуйста, попробуйте позже.")
                console.error("Error:", error)
            })
    }

    function handleAutocomplete() {
        const query = locationInput.value.trim();
        autocompleteResults.innerHTML = '';

        if (query.length < 2) {
            autocompleteResults.classList.add('hidden');
            return;
        }

        fetch('/autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        })
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(locations => {
                if (locations.length === 0) {
                    autocompleteResults.classList.add('hidden');
                    return;
                }

                locations.forEach(location => {
                    const item = document.createElement('div');
                    item.className = 'p-3 hover:bg-gray-100 cursor-pointer';
                    item.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                    <span>${location.name}</span>
                </div>
            `;
                    item.addEventListener('click', () => {
                        locationInput.value = location.name;
                        autocompleteResults.classList.add('hidden');
                        searchLocation();
                    });
                    autocompleteResults.appendChild(item);
                });

                autocompleteResults.classList.remove('hidden');
            })
            .catch(error => {
                console.error('Autocomplete error:', error);
                autocompleteResults.classList.add('hidden');
            });
    }

    function isValidData(data) {
        return data && typeof data === "object" && !data.error
    }

    function displayWeather(weather) {
        if (!weather) return;

        const tempUnit = currentUnits === "metric" ? "°C" : "°F";
        const speedUnit = currentUnits === "metric" ? "м/с" : "миль/ч";

        // Форматирование времени восхода и заката
        const formatTime = (timestamp) => {
            if (!timestamp) return "Н/Д";
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        };

        // Форматирование видимости
        const visibility = weather.visibility
            ? `${(weather.visibility / 1000).toFixed(1)} км`
            : "Н/Д";

        // Проверки наличия данных
        const feelsLike = weather.feels_like ? Math.round(weather.feels_like) : "Н/Д";
        const tempMax = weather.temp_max ? Math.round(weather.temp_max) : "Н/Д";
        const tempMin = weather.temp_min ? Math.round(weather.temp_min) : "Н/Д";
        const humidity = weather.humidity ?? "Н/Д";
        const windSpeed = weather.wind_speed ?? "Н/Д";
        const pressure = weather.pressure ?? "Н/Д";

        weatherContent.innerHTML = `
        <div class="flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
                ${weather.icon ? `
                    <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" 
                        alt="${weather.description}" 
                        class="weather-icon w-20 h-20 mr-4">
                ` : ''}
                <div class="ml-4">
                    <h3 class="text-4xl font-bold">${Math.round(weather.temp)}${tempUnit}</h3>
                    <p class="text-lg capitalize">${weather.description}</p>
                </div>
            </div>
            <div class="text-center md:text-right">
                <p class="text-sm">Ощущается как: 
                    <span class="font-bold">${feelsLike}${tempUnit}</span>
                </p>
                <div class="flex items-center justify-center md:justify-end mt-1">
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        <i class="fas fa-arrow-up text-red-500 mr-1"></i>${tempMax}${tempUnit}
                    </span>
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full ml-2">
                        <i class="fas fa-arrow-down text-blue-500 mr-1"></i>${tempMin}${tempUnit}
                    </span>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div class="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
                <i class="fas fa-tint text-blue-500 text-xl mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-gray-400">Влажность</p>
                <p class="font-bold">${humidity}%</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
                <i class="fas fa-wind text-blue-500 text-xl mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-gray-400">Ветер</p>
                <p class="font-bold">${windSpeed} ${speedUnit}</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
                <i class="fas fa-compress-alt text-blue-500 text-xl mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-gray-400">Давление</p>
                <p class="font-bold">${pressure} гПа</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
                <i class="fas fa-eye text-blue-500 text-xl mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-gray-400">Видимость</p>
                <p class="font-bold">${visibility}</p>
            </div>
        </div>
        <div class="flex justify-between items-center mt-6 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
            <div class="flex items-center">
                <i class="fas fa-sun text-yellow-500 mr-2"></i>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Восход</p>
                    <p class="font-medium">${formatTime(weather.sunrise)}</p>
                </div>
            </div>
            <div class="flex items-center">
                <i class="fas fa-moon text-blue-300 mr-2"></i>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Закат</p>
                    <p class="font-medium">${formatTime(weather.sunset)}</p>
                </div>
            </div>
        </div>
    `;
    }

    function updatePollutantsChart(pollutants) {
        if (pollutantsChart) {
            pollutantsChart.destroy();
        }

        const ctx = document.getElementById('pollutants-chart').getContext('2d');
        pollutantsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(pollutants),
                datasets: [{
                    label: 'Концентрация (μg/m³)',
                    data: Object.values(pollutants),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    function displayAirQuality(airQuality) {
        const previewContainer = document.getElementById('air-quality-content');
        const detailedContainer = document.getElementById('air-quality-detailed');

        if (!previewContainer || !detailedContainer) return;

        // Очистка контейнеров
        previewContainer.innerHTML = '';
        detailedContainer.innerHTML = '';

        if (!airQuality || airQuality.error) {
            previewContainer.innerHTML = `
            <div class="text-center py-4 text-red-500">
                ${airQuality?.error || 'Данные о качестве воздуха недоступны'}
            </div>`;
            return;
        }

        // Полные данные из API
        const {
            aqi = 0,
            level = {},
            temperature = 0,
            humidity = 0,
            wind_speed = 0,
            pressure = 0,
            dominant_pollutant = 'Н/Д',
            timestamp = Date.now(),
            pollutants = {}
        } = airQuality;

        // Форматирование времени
        const measurementTime = new Date(timestamp).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Превью на главной странице
        previewContainer.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <p class="text-sm text-gray-500 mb-1">Индекс AQI</p>
                <p class="text-3xl font-bold ${getAqiColor(aqi)}">${aqi}</p>
                <p class="text-sm mt-1">${level.label || 'Н/Д'}</p>
            </div>
            ${['PM2.5', 'PM10', 'NO2', 'O3'].map(p => `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <p class="text-sm text-gray-500 mb-1">${getPollutantName(p)}</p>
                    <p class="text-2xl font-bold">${pollutants[p]?.toFixed(1) || '0.0'}</p>
                    <p class="text-xs text-gray-400">μg/m³</p>
                </div>
            `).join('')}
        </div>`;

        // Детальная информация
        detailedContainer.innerHTML = `
        <div class="space-y-6">
            <!-- Заголовок -->
            <div class="${level.color} text-white rounded-xl p-6 shadow-lg">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <div class="text-center md:text-left">
                        <p class="text-5xl font-bold mb-2">${aqi}</p>
                        <p class="text-lg">${level.label}</p>
                    </div>
                    <div class="mt-4 md:mt-0 text-center md:text-right">
                        <p class="text-xl font-semibold">${level.advice}</p>
                        <p class="text-sm opacity-90 mt-2">${level.description}</p>
                    </div>
                </div>
            </div>

            <!-- Основные параметры -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Метеопараметры -->
                <div class="space-y-4">
                    <h3 class="text-xl font-bold">Метеорологические условия</h3>
                    <div class="grid grid-cols-2 gap-4">
                        ${createParamCard('Температура', `${Math.round(temperature)}°C`, 'fas fa-thermometer-half')}
                        ${createParamCard('Влажность', `${humidity}%`, 'fas fa-tint')}
                        ${createParamCard('Ветер', `${wind_speed.toFixed(1)} м/с`, 'fas fa-wind')}
                        ${createParamCard('Давление', `${pressure} гПа`, 'fas fa-tachometer-alt')}
                    </div>
                </div>

                <!-- Загрязнители -->
                <div class="space-y-4">
                    <h3 class="text-xl font-bold">Концентрация загрязнителей</h3>
                    <div class="grid grid-cols-2 gap-4">
                        ${Object.entries(pollutants).map(([key, value]) => `
                            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <p class="text-sm text-gray-500">${getPollutantName(key)}</p>
                                        <p class="text-2xl font-bold">${value.toFixed(1)}</p>
                                    </div>
                                    <i class="${getPollutantIcon(key)} text-xl text-gray-400"></i>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">μg/m³</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Дополнительная информация -->
            <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-xl">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="font-semibold">Основной загрязнитель:</p>
                        <p class="text-lg">${dominant_pollutant}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            <i class="fas fa-clock mr-2"></i>
                            Обновлено: ${measurementTime}
                        </p>
                    </div>
                </div>
            </div>
        </div>`;

        // Обновление графика
        if (Object.keys(pollutants).length > 0) {
            initPollutantsChart(pollutants);
        }

        // Вспомогательные функции
        function createParamCard(title, value, icon) {
            return `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div class="flex items-center">
                    <i class="${icon} text-gray-400 mr-3"></i>
                    <div>
                        <p class="text-sm text-gray-500">${title}</p>
                        <p class="text-xl font-bold">${value}</p>
                    </div>
                </div>
            </div>`;
        }

        function getAqiColor(aqi) {
            const colors = {
                1: 'text-green-600',
                2: 'text-yellow-600',
                3: 'text-orange-600',
                4: 'text-red-600',
                5: 'text-purple-600'
            };
            return colors[aqi] || 'text-gray-600';
        }

        function getPollutantName(key) {
            const names = {
                'PM2.5': 'PM2.5 (Твердые частицы)',
                'PM10': 'PM10 (Крупные частицы)',
                'O3': 'Озон (O₃)',
                'NO2': 'Диоксид азота (NO₂)',
                'SO2': 'Диоксид серы (SO₂)',
                'CO': 'Угарный газ (CO)'
            };
            return names[key] || key;
        }

        function getPollutantIcon(key) {
            const icons = {
                'PM2.5': 'fas fa-smog',
                'PM10': 'fas fa-cloud-meatball',
                'O3': 'fas fa-cloud-sun',
                'NO2': 'fas fa-industry',
                'SO2': 'fas fa-fire',
                'CO': 'fas fa-skull-crossbones'
            };
            return icons[key] || 'fas fa-question-circle';
        }
    }

    function getComponentColor(component, value) {
        // Define thresholds for different components
        const thresholds = {
            "PM2.5": { good: 10, moderate: 25, poor: 50, very_poor: 75 },
            PM10: { good: 20, moderate: 50, poor: 100, very_poor: 200 },
            O3: { good: 60, moderate: 120, poor: 180, very_poor: 240 },
            NO2: { good: 40, moderate: 90, poor: 120, very_poor: 230 },
            SO2: { good: 20, moderate: 80, poor: 250, very_poor: 350 },
            CO: { good: 4400, moderate: 9400, poor: 12400, very_poor: 15400 },
        }

        const key = component.toUpperCase()
        const threshold = thresholds[key] || thresholds["PM2.5"] // Default to PM2.5 if component not found

        if (value <= threshold.good) return "bg-green-500"
        if (value <= threshold.moderate) return "bg-yellow-500"
        if (value <= threshold.poor) return "bg-orange-500"
        if (value <= threshold.very_poor) return "bg-red-500"
        return "bg-purple-500"
    }

    function getComponentPercentage(component, value) {
        // Define max values for percentage calculation
        const maxValues = {
            "PM2.5": 100,
            PM10: 200,
            O3: 300,
            NO2: 250,
            SO2: 500,
            CO: 20000,
        }

        const key = component.toUpperCase()
        const maxValue = maxValues[key] || 100 // Default to 100 if component not found

        return Math.min(100, (value / maxValue) * 100)
    }

    function displayEvents(events) {
        if (!events || !Array.isArray(events) || events.length === 0) {
            eventsContent.innerHTML = ""
            noEventsDiv.classList.remove("hidden")
            return
        }

        noEventsDiv.classList.add("hidden")

        const eventsHtml = events
            .map((event, index) => {
                const delay = index * 0.1

                return `
        <div class="event-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-4 fade-in" style="animation-delay: ${delay}s" data-free="${event.is_free}">
          <div class="flex flex-col md:flex-row">
            <div class="flex-1">
              <div class="flex items-start">
                ${event.image_url ? `<img src="${event.image_url}" alt="${event.name}" class="w-16 h-16 object-cover rounded-lg mr-4">` : ""}
                <div>
                  <h3 class="text-xl font-semibold text-indigo-700 dark:text-indigo-400">${event.name}</h3>
                  <span class="inline-block px-2 py-1 text-xs rounded-full ${event.is_free ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"} mt-1">
                    ${event.is_free ? "Бесплатно" : "Платно"}
                  </span>
                  <span class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mt-1 ml-1">
                    ${event.category}
                  </span>
                </div>
              </div>
              <p class="text-gray-600 dark:text-gray-300 mt-3">${event.description}</p>
              <div class="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p><i class="far fa-calendar-alt mr-2"></i>${event.start_display}</p>
                <p><i class="fas fa-map-marker-alt mr-2"></i>${event.venue_name}${event.venue_address ? ` - ${event.venue_address}` : ""}</p>
              </div>
            </div>
            <div class="mt-4 md:mt-0 md:ml-6 flex flex-col items-start md:items-end justify-between">
              <a href="${event.url}" target="_blank" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                Подробнее
              </a>
              <div class="mt-2 text-sm">
                <span class="text-gray-500 dark:text-gray-400">
                  <i class="fas fa-users mr-1"></i> ${event.attendees || "Н/Д"} участников
                </span>
              </div>
            </div>
          </div>
        </div>
      `
            })
            .join("")

        eventsContent.innerHTML = eventsHtml
    }

    function displayEventsPreview(events) {
        if (!events || !Array.isArray(events) || events.length === 0) {
            eventsPreviewContent.innerHTML = ""
            noEventsPreviewDiv.classList.remove("hidden")
            return
        }

        noEventsPreviewDiv.classList.add("hidden")

        // Display only the first 3 events
        const previewEvents = events.slice(0, 3)

        const eventsHtml = previewEvents
            .map((event, index) => {
                return `
        <div class="event-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3">
          <div class="flex items-start">
            ${event.image_url ? `<img src="${event.image_url}" alt="${event.name}" class="w-12 h-12 object-cover rounded-lg mr-3">` : ""}
            <div>
              <h3 class="font-semibold text-indigo-700 dark:text-indigo-400">${event.name}</h3>
              <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                <p><i class="far fa-calendar-alt mr-2"></i>${event.start_display}</p>
                <p class="truncate"><i class="fas fa-map-marker-alt mr-2"></i>${event.venue_name}</p>
              </div>
            </div>
          </div>
        </div>
      `
            })
            .join("")

        eventsPreviewContent.innerHTML = eventsHtml
    }

    function displayForecastPreview(forecast) {
        const forecastCards = document.getElementById("forecast-cards");
        if (!forecastCards) return;

        forecastCards.innerHTML = "";

        // Проверка на ошибки
        if (!forecast || forecast.error || !Array.isArray(forecast)) {
            forecastCards.innerHTML = `
            <div class="col-span-5 flex items-center justify-center h-32">
                <p class="text-red-500">
                    ${forecast?.error || "Данные прогноза недоступны"}
                </p>
            </div>
        `;
            return;
        }

        forecast.forEach((day) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString("ru-RU", {
                weekday: "short",
                month: "short",
                day: "numeric"
            });

            const temp = Math.round(day.temp) || "Н/Д";
            const icon = day.icon || "02d";
            const humidity = day.humidity ?? "Н/Д";
            const windSpeed = day.wind_speed ?? "Н/Д";

            const card = document.createElement("div");
            card.className = "forecast-card bg-white dark:bg-gray-800 p-3 rounded-lg text-center";
            card.innerHTML = `
            <p class="font-medium">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" 
                 alt="${day.description}" 
                 class="mx-auto w-12 h-12">
            <p class="text-lg font-bold">${temp}${currentUnits === "metric" ? "°C" : "°F"}</p>
            <p class="text-xs capitalize text-gray-500 dark:text-gray-400">${day.description || "Н/Д"}</p>
            <div class="mt-2 text-sm space-y-1">
                <p><i class="fas fa-tint mr-1"></i>${humidity}%</p>
                <p><i class="fas fa-wind mr-1"></i>${windSpeed} ${currentUnits === "metric" ? "м/с" : "миль/ч"}</p>
            </div>
        `;

            forecastCards.appendChild(card);
        });
    }

    function displayDetailedForecast(forecast) {
        if (!forecast || !Array.isArray(forecast) || forecast.length === 0) {
            const forecastDetailed = document.getElementById("forecast-detailed");
            if (forecastDetailed) {
                forecastDetailed.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    Нет данных для отображения прогноза
                </div>
            `;
            }
            return;
        }

        const forecastDetailed = document.getElementById("forecast-detailed");
        forecastDetailed.innerHTML = "";

        // Data validation and chart preparation
        const chartLabels = [];
        const chartData = [];
        const tempUnit = currentUnits === "metric" ? "°C" : "°F";
        const speedUnit = currentUnits === "metric" ? "м/с" : "миль/ч";

        forecast.forEach((day) => {
            // Date formatting with validation
            const date = day.date ? new Date(day.date) : new Date();
            const dayName = date.toLocaleDateString("ru-RU", {
                weekday: "long",
                timeZone: "UTC"
            }).replace(/,.*$/, ""); // Remove year for better readability

            const monthDay = date.toLocaleDateString("ru-RU", {
                month: "short",
                day: "numeric",
                timeZone: "UTC"
            });

            // Data validation
            const temp = Math.round(day.temp) || "Н/Д";
            const description = day.description?.replace(/^\w/, c => c.toUpperCase()) || "Н/Д";
            const icon = day.icon || "02d";
            const humidity = day.humidity ?? "Н/Д";
            const windSpeed = day.wind_speed ?? "Н/Д";

            // Chart data
            if (typeof day.temp === "number") {
                chartLabels.push(dayName.substring(0, 3));
                chartData.push(temp);
            }

            // Create day card
            const dayCard = document.createElement("div");
            dayCard.className = "bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-4";
            dayCard.innerHTML = `
            <div class="bg-blue-50 dark:bg-blue-900 p-3">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold">${dayName}, ${monthDay}</h3>
                    <div>
                        <span class="text-blue-600 dark:text-blue-400 font-medium">
                            ${temp}${tempUnit}
                        </span>
                    </div>
                </div>
            </div>
            <div class="p-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" 
                             alt="${description}" 
                             class="w-16 h-16 mr-4">
                        <div>
                            <p class="capitalize text-lg">${description}</p>
                            <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <p class="flex items-center">
                                    <i class="fas fa-tint mr-2"></i>
                                    Влажность: ${humidity}%
                                </p>
                                <p class="flex items-center mt-1">
                                    <i class="fas fa-wind mr-2"></i>
                                    Ветер: ${windSpeed} ${speedUnit}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

            forecastDetailed.appendChild(dayCard);
        });

        // Update temperature chart
        if (temperatureChart) {
            temperatureChart.destroy();
        }

        if (chartLabels.length > 0 && chartData.length > 0) {
            const ctx = document.getElementById("temperature-chart").getContext("2d");
            temperatureChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: `Температура (${tempUnit})`,
                        data: chartData,
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        borderColor: "rgba(59, 130, 246, 1)",
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) =>
                                    `${context.dataset.label}: ${context.raw}${tempUnit}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: tempUnit },
                            beginAtZero: false
                        }
                    }
                }
            });
        }
    }

    function displayMap(lat, lon, city, weatherData) {
        if (!lat || !lon) return;

        // Полная переинициализация карты
        const mapElement = document.getElementById('map');
        if (map) {
            map.remove();
            mapElement.innerHTML = ''; // Критически важно
        }

        map = L.map(mapElement, {
            preferCanvas: true
        }).setView([lat, lon], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Обновление маркера
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${city}</b><br>${weatherData.description}, ${Math.round(weatherData.temp)}${currentUnits === "metric" ? "°C" : "°F"}`)
            .openPopup();

        // Обновление информации о местоположении
        document.getElementById("coordinates").textContent = `Координаты: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        document.getElementById("country-info").textContent = `Страна: ${weatherData.country}`;
        document.getElementById("city-info").textContent = `Город: ${city}`;

        // Обновление ссылки Google Maps
        document.getElementById("open-maps-link").href = `https://www.google.com/maps?q=${lat},${lon}`;
    }

    function displayFullMap(lat, lon, city, weatherData) {
        if (!lat || !lon) return;

        const mapFullElement = document.getElementById('map-full');
        if (mapFull) {
            mapFull.remove();
            mapFullElement.innerHTML = ''; // Критически важно
        }

        mapFull = L.map(mapFullElement, {
            preferCanvas: true
        }).setView([lat, lon], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapFull);

        // Обновление маркера
        if (markerFull) mapFull.removeLayer(markerFull);
        markerFull = L.marker([lat, lon]).addTo(mapFull)
            .bindPopup(`<b>${city}</b><br>${weatherData.description}, ${Math.round(weatherData.temp)}${currentUnits === "metric" ? "°C" : "°F"}`)
            .openPopup();

        // Обновление информации о местоположении
        document.getElementById("coordinates-full").textContent = `Координаты: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        document.getElementById("country-info-full").textContent = `Страна: ${weatherData.country}`;
        document.getElementById("city-info-full").textContent = `Город: ${city}`;

        // Обновление ссылки Google Maps
        document.getElementById("open-maps-link-full").href = `https://www.google.com/maps?q=${lat},${lon}`;
    }

    function filterEvents(filter) {
        const eventCards = document.querySelectorAll("#events-content .event-card")

        eventCards.forEach((card) => {
            const isFree = card.dataset.free === "true"

            if (filter === "all" || (filter === "free" && isFree) || (filter === "paid" && !isFree)) {
                card.classList.remove("hidden")
            } else {
                card.classList.add("hidden")
            }
        })
    }

    function searchEvents() {
        const searchTerm = eventSearch.value.toLowerCase()
        const eventCards = document.querySelectorAll("#events-content .event-card")

        eventCards.forEach((card) => {
            const eventText = card.textContent.toLowerCase()

            if (eventText.includes(searchTerm)) {
                card.classList.remove("hidden")
            } else {
                card.classList.add("hidden")
            }
        })
    }

    function switchTab(tabId) {
        // Update tab buttons
        tabButtons.forEach((button) => {
            if (button.dataset.tab === tabId) {
                button.classList.add("active")
            } else {
                button.classList.remove("active")
            }
        })

        // Update tab content
        tabContents.forEach((content) => {
            if (content.id === tabId) {
                content.classList.remove("hidden")
            } else {
                content.classList.add("hidden")
            }
        })

        // Special handling for map tabs
        if (tabId === "map-tab" && mapFull) {
            setTimeout(() => {
                mapFull.invalidateSize()
            }, 100)
        }

        if (tabId === 'air-quality-tab' && currentAirQualityData) {
            displayAirQuality(currentAirQualityData);
            updatePollutantsChart(currentAirQualityData);
        }
    }

    function toggleFavorite() {
        if (!currentLocation) return

        const isFavorite = favorites.some((fav) => fav.name === currentLocation)

        if (isFavorite) {
            // Remove from favorites
            favorites = favorites.filter((fav) => fav.name !== currentLocation)
            favoriteBtn.innerHTML = '<i class="far fa-star"></i>'
            favoriteBtn.classList.remove("active")
        } else {
            // Add to favorites
            favorites.push({
                name: currentLocation,
                data: {
                    weather: currentWeatherData,
                    lat: currentWeatherData?.lat,
                    lon: currentWeatherData?.lon,
                },
            })
            favoriteBtn.innerHTML = '<i class="fas fa-star"></i>'
            favoriteBtn.classList.add("active")
        }

        // Save to localStorage
        localStorage.setItem("favorites", JSON.stringify(favorites))

        // Update favorites list
        updateFavoritesList()
    }

    function updateFavoriteButton() {
        const isFavorite = favorites.some((fav) => fav.name === currentLocation)

        if (isFavorite) {
            favoriteBtn.innerHTML = '<i class="fas fa-star"></i>'
            favoriteBtn.classList.add("active")
        } else {
            favoriteBtn.innerHTML = '<i class="far fa-star"></i>'
            favoriteBtn.classList.remove("active")
        }
    }

    function updateFavoritesList() {
        favoritesList.innerHTML = ""

        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="py-2 px-4 text-gray-500 text-sm">
                    Нет сохраненных избранных
                </div>
            `
            return
        }

        favorites.forEach((favorite) => {
            const item = document.createElement("div")
            item.className =
                "py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"

            item.innerHTML = `
                <span>${favorite.name}</span>
                <button class="text-red-500 hover:text-red-700" data-location="${favorite.name}">
                    <i class="fas fa-times"></i>
                </button>
            `

            item.addEventListener("click", (e) => {
                if (e.target.closest("button")) {
                    // If the delete button was clicked
                    const locationName = e.target.closest("button").dataset.location
                    favorites = favorites.filter((fav) => fav.name !== locationName)
                    localStorage.setItem("favorites", JSON.stringify(favorites))
                    updateFavoritesList()
                    updateFavoriteButton()
                    e.stopPropagation()
                } else {
                    // If the item itself was clicked
                    locationInput.value = favorite.name
                    favoritesList.classList.add("hidden")
                    searchLocation()
                }
            })

            favoritesList.appendChild(item)
        })
    }

    function toggleFavoritesList() {
        favoritesList.classList.toggle("hidden")
    }

    function openShareModal() {
        if (!currentLocation) return

        // Generate share URL
        const shareUrlText = `${window.location.origin}${window.location.pathname}?location=${encodeURIComponent(currentLocation)}`
        shareUrl.value = shareUrlText

        // Update social share links
        document.getElementById("share-twitter").href =
            `https://twitter.com/intent/tweet?text=Посмотрите погоду в ${currentLocation}&url=${encodeURIComponent(shareUrlText)}`
        document.getElementById("share-facebook").href =
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrlText)}`
        document.getElementById("share-whatsapp").href =
            `https://wa.me/?text=Посмотрите погоду в ${currentLocation}: ${encodeURIComponent(shareUrlText)}`

        // Show modal
        shareModal.classList.remove("hidden")
    }

    function closeShareModalHandler() {
        shareModal.classList.add("hidden")
    }

    function copyShareUrl() {
        shareUrl.select()
        document.execCommand("copy")

        // Show feedback
        const originalText = copyUrlBtn.innerHTML
        copyUrlBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Скопировано!'

        setTimeout(() => {
            copyUrlBtn.innerHTML = originalText
        }, 2000)
    }

    function setUnits(units) {
        if (currentUnits === units) return

        currentUnits = units

        // Update UI
        if (units === "metric") {
            metricToggle.classList.add("active")
            imperialToggle.classList.remove("active")
        } else {
            metricToggle.classList.remove("active")
            imperialToggle.classList.add("active")
        }

        // If we have data, refresh it with new units
        if (currentLocation) {
            searchLocation()
        }
    }

    function getUserLocation() {
        if (!navigator.geolocation) {
            showError("Геолокация не поддерживается вашим браузером")
            return
        }

        loadingDiv.classList.remove("hidden")
        errorDiv.classList.add("hidden")

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude

                // Reverse geocode to get city name
                fetch(`/reverse-geocode?lat=${lat}&lon=${lon}`)
                    .then((response) => response.json())
                    .then((data) => {
                        loadingDiv.classList.add("hidden")

                        if (data.error) {
                            showError(data.error)
                            return
                        }

                        locationInput.value = data.city
                        currentLocation = data.city
                        searchLocation()
                    })
                    .catch((error) => {
                        loadingDiv.classList.add("hidden")
                        showError("Не удалось определить ваше местоположение. Пожалуйста, введите его вручную.")
                        console.error("Error:", error)
                    })
            },
            (error) => {
                loadingDiv.classList.add("hidden")

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showError("Вы отклонили запрос на геолокацию")
                        break
                    case error.POSITION_UNAVAILABLE:
                        showError("Информация о местоположении недоступна")
                        break
                    case error.TIMEOUT:
                        showError("Истекло время ожидания запроса на определение местоположения")
                        break
                    default:
                        showError("Произошла неизвестная ошибка")
                        break
                }
            },
        )
    }

    function showError(message) {
        errorDiv.textContent = message
        errorDiv.classList.remove("hidden")
    }

    function toggleTheme() {
        if (themeToggle.checked) {
            document.body.classList.add("dark-mode")
            localStorage.setItem("theme", "dark")
        } else {
            document.body.classList.remove("dark-mode")
            localStorage.setItem("theme", "light")
        }

        // Update maps if they exist
        if (map) {
            setTimeout(() => {
                map.invalidateSize()
            }, 100)
        }

        if (mapFull) {
            setTimeout(() => {
                mapFull.invalidateSize()
            }, 100)
        }
    }

    function initTheme() {
        const savedTheme = localStorage.getItem("theme")

        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode")
            themeToggle.checked = true
        }
    }

    function setMapStyle(style) {
        if (!mapFull) return

        if (style === "satellite") {
            // Remove current tile layer
            mapFull.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    mapFull.removeLayer(layer)
                }
            })

            // Add satellite layer
            L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            }).addTo(mapFull)
        } else {
            // Remove current tile layer
            mapFull.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    mapFull.removeLayer(layer)
                }
            })

            // Add street layer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapFull)
        }
    }

    function togglePointsOfInterest() {
        if (!mapFull || !currentWeatherData) return

        const showPOI = document.getElementById("show-poi").checked

        // Remove existing POI markers
        mapFull.eachLayer((layer) => {
            if (layer._icon && layer._icon.classList.contains("poi-marker")) {
                mapFull.removeLayer(layer)
            }
        })

        if (showPOI) {
            // Add POI markers
            const lat = currentWeatherData.lat
            const lon = currentWeatherData.lon

            fetch(`/points-of-interest?lat=${lat}&lon=${lon}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        console.error("Error fetching POIs:", data.error)
                        return
                    }

                    data.forEach((poi) => {
                        const poiIcon = L.divIcon({
                            html: `<i class="fas fa-${poi.icon || "landmark"} text-indigo-600"></i>`,
                            className: "poi-marker",
                            iconSize: [24, 24],
                            iconAnchor: [12, 12],
                        })

                        const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon }).addTo(mapFull)
                        marker.bindPopup(`
                            <div>
                                <h3 class="font-bold">${poi.name}</h3>
                                <p>${poi.category || ""}</p>
                                ${poi.address ? `<p class="text-sm text-gray-600">${poi.address}</p>` : ""}
                            </div>
                        `)
                    })
                })
                .catch((error) => {
                    console.error("Error:", error)
                })
        }
    }

    // Check for location in URL params on page load
    const urlParams = new URLSearchParams(window.location.search)
    const locationParam = urlParams.get("location")

    if (locationParam) {
        locationInput.value = locationParam
        searchLocation()
    }

    // Close autocomplete when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#location") && !e.target.closest("#autocomplete-results")) {
            autocompleteResults.classList.add("hidden")
        }
    })

    // Close favorites list when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#favorites-dropdown")) {
            favoritesList.classList.add("hidden")
        }
    })

    // Close share modal when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target === shareModal) {
            closeShareModalHandler()
        }
    })

    // Handle escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            autocompleteResults.classList.add("hidden")
            favoritesList.classList.add("hidden")
            shareModal.classList.add("hidden")
        }
    })
})
