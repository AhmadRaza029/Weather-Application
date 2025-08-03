/**
 * Main Application Script
 * Handles UI interactions, geolocation, and weather data display
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    window.app = new WeatherApp();
    app.initialize();
    
    // Initialize services after app is initialized
    window.weatherService = new WeatherService();
    window.userService = new UserService();
    window.mapsService = new MapsService();
    window.chartsService = new ChartsService();
});

class WeatherApp {
    constructor() {
        // DOM Elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.currentLocationBtn = document.getElementById('currentLocationBtn');
        this.notificationBtn = document.getElementById('notificationBtn');
        this.alertsToggle = document.getElementById('alertsToggle');
        this.themeToggle = document.getElementById('themeToggleBtn');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.hourlyForecastContainer = document.getElementById('hourlyForecastContainer');
        
        // Current location and data
        this.currentLocation = null;
        this.weatherData = null;
        
        // Alert checking interval
        this.alertCheckInterval = null;
        
        // Auto refresh timer
        this.refreshTimer = null;
        
        // Current theme
        this.currentTheme = localStorage.getItem('theme') || 'light';
    }
    
    /**
     * Initialize the application
     */
    initialize() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check for notification permission
        this.checkNotificationPermission();
        
        // Try to load last location from localStorage
        this.loadSavedLocation();
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Search button click
        this.searchBtn.addEventListener('click', () => {
            const query = this.searchInput.value.trim();
            if (query) {
                this.searchLocation(query);
            }
        });
        
        // Search input enter key
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = this.searchInput.value.trim();
                if (query) {
                    this.searchLocation(query);
                }
            }
        });
        
        // Current location button
        this.currentLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });
        
        // Notification button
        this.notificationBtn.addEventListener('click', () => {
            this.requestNotificationPermission();
        });
        
        // Alerts toggle
        this.alertsToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            if (this.currentLocation) {
                this.toggleAlerts(enabled);
            }
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => {
            const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            
            // Update icon
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
        
        // Note: Hourly forecast toggle is not implemented in the HTML yet
        // We'll show hourly forecast by default when data is available
    }
    
    /**
     * Check if notification permission is already granted
     */
    checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.updateNotificationButton(true);
            } else {
                this.updateNotificationButton(false);
            }
        } else {
            // Notifications not supported
            this.notificationBtn.disabled = true;
            this.notificationBtn.textContent = 'Notifications Not Supported';
        }
    }
    
    /**
     * Request permission for notifications
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                this.updateNotificationButton(permission === 'granted');
                
                if (permission === 'granted' && this.currentLocation) {
                    // Start checking for alerts if permission granted
                    this.startAlertChecking();
                }
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }
    }
    
    /**
     * Update notification button appearance based on permission
     * @param {boolean} granted - Whether notification permission is granted
     */
    updateNotificationButton(granted) {
        if (granted) {
            this.notificationBtn.innerHTML = '<i class="fas fa-bell"></i> Alerts Enabled';
            this.notificationBtn.classList.add('btn-success');
            this.notificationBtn.classList.remove('btn-light');
        } else {
            this.notificationBtn.innerHTML = '<i class="fas fa-bell"></i> Enable Alerts';
            this.notificationBtn.classList.add('btn-light');
            this.notificationBtn.classList.remove('btn-success');
        }
    }
    
    /**
     * Get current location using geolocation API
     */
    getCurrentLocation() {
        if (navigator.geolocation) {
            this.showLoading();
            
            navigator.geolocation.getCurrentPosition(
                // Success callback
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        
                        // Get location name from coordinates
                        const locationData = await weatherService.reverseGeocode(latitude, longitude);
                        
                        this.currentLocation = {
                            lat: latitude,
                            lon: longitude,
                            name: locationData.name,
                            country: locationData.country
                        };
                        
                        // Save location to localStorage
                        this.saveLocation();
                        
                        // Fetch and display weather data
                        await this.fetchWeatherData();
                    } catch (error) {
                        this.showError(error.message);
                    } finally {
                        this.hideLoading();
                    }
                },
                // Error callback
                (error) => {
                    let errorMessage = 'Unable to retrieve your location';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access was denied. Please enable location services.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out.';
                            break;
                    }
                    
                    this.showError(errorMessage);
                    this.hideLoading();
                }
            );
        } else {
            this.showError('Geolocation is not supported by your browser');
        }
    }
    
    /**
     * Search for a location by name
     * @param {string} query - Location name to search for
     */
    async searchLocation(query) {
        try {
            this.showLoading();
            
            // Search for location
            const locations = await window.weatherService.searchLocation(query);
            
            // Use the first result
            const location = locations[0];
            
            this.currentLocation = {
                lat: location.lat,
                lon: location.lon,
                name: location.name,
                country: location.country
            };
            
            // Save location to localStorage
            this.saveLocation();
            
            // Fetch and display weather data
            await this.fetchWeatherData();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Fetch weather data for current location
     */
    async fetchWeatherData() {
        if (!this.currentLocation) {
            return;
        }
        
        try {
            this.showLoading();
            
            // Get comprehensive weather data including hourly forecast
            const oneCallData = await window.weatherService.getOneCallData(this.currentLocation, true);
            
            // Get current weather (more detailed than OneCall current)
            const currentWeather = await window.weatherService.getCurrentWeather(this.currentLocation);
            
            // Store the combined data
            this.weatherData = {
                current: currentWeather,
                forecast: oneCallData.daily,
                hourly: oneCallData.hourly || [],
                alerts: oneCallData.alerts || []
            };
            
            // Update UI with weather data
            this.updateWeatherUI();
            
            // Update maps if enabled
            if (CONFIG.UI.ENABLE_MAPS && window.mapsService) {
                window.mapsService.updateMap(this.currentLocation);
            }
            
            // Update charts if enabled
            if (CONFIG.UI.ENABLE_CHARTS && window.chartsService) {
                window.chartsService.updateCharts(this.weatherData);
            }
            
            // Check for alerts
            this.processAlerts();
            
            // Start alert checking if notifications are enabled
            if (Notification.permission === 'granted') {
                this.startAlertChecking();
            }
            
            // Set up auto refresh
            this.setupAutoRefresh();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Update UI with weather data
     */
    updateWeatherUI() {
        if (!this.weatherData) {
            return;
        }
        
        // Hide welcome message and show weather display
        this.welcomeMessage.classList.add('d-none');
        this.weatherDisplay.classList.remove('d-none');
        
        // Update current weather
        this.updateCurrentWeather();
        
        // Update forecast
        this.updateForecast();
        
        // Update hourly forecast if available
        if (this.weatherData.hourly && this.weatherData.hourly.length > 0) {
            this.updateHourlyForecast();
            document.getElementById('hourlyForecastSection').classList.remove('d-none');
        } else {
            document.getElementById('hourlyForecastSection').classList.add('d-none');
        }
    }
    
    /**
     * Update current weather section
     */
    updateCurrentWeather() {
        const current = this.weatherData.current;
        
        // Location
        document.getElementById('cityName').textContent = this.currentLocation.name;
        document.getElementById('countryCode').textContent = this.currentLocation.country;
        
        // Weather icon and description
        const weatherIcon = document.getElementById('weatherIcon');
        const iconCode = current.weather[0].icon;
        weatherIcon.src = window.weatherService.getIconUrl(iconCode, 4);
        weatherIcon.alt = current.weather[0].description;
        
        document.getElementById('weatherDescription').textContent = current.weather[0].description;
        
        // Temperature and details
        document.getElementById('temperature').textContent = window.weatherService.formatTemperature(current.main.temp);
        document.getElementById('feelsLike').textContent = window.weatherService.formatTemperature(current.main.feels_like);
        document.getElementById('humidity').textContent = `${current.main.humidity}%`;
        document.getElementById('windSpeed').textContent = window.weatherService.formatWindSpeed(current.wind.speed);
        
        // Last updated
        document.getElementById('lastUpdated').textContent = window.weatherService.formatDateTime(current.dt);
    }
    
    /**
     * Update forecast section
     */
    updateForecast() {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';
        
        // Get forecast data (skip today)
        const forecast = this.weatherData.forecast.slice(1, CONFIG.UI.MAX_FORECAST_DAYS + 1);
        
        // Create forecast items
        forecast.forEach(day => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'col forecast-item';
            
            const iconUrl = window.weatherService.getIconUrl(day.weather[0].icon, 2);
            const date = window.weatherService.formatDateTime(day.dt, 'day');
            const maxTemp = window.weatherService.formatTemperature(day.temp.max);
            const minTemp = window.weatherService.formatTemperature(day.temp.min);
            const description = day.weather[0].description;
            
            forecastItem.innerHTML = `
                <div class="forecast-date">${date}</div>
                <img src="${iconUrl}" alt="${description}" class="forecast-icon">
                <div class="forecast-temp">${maxTemp} / ${minTemp}</div>
                <div class="forecast-desc">${description}</div>
            `;
            
            forecastContainer.appendChild(forecastItem);
        });
    }
    
    /**
     * Process weather alerts
     */
    processAlerts() {
        const alerts = this.weatherData.alerts || [];
        const alertsContainer = document.getElementById('alertsContainer');
        const noAlertsMessage = document.getElementById('noAlertsMessage');
        const alertsList = document.getElementById('alertsList');
        
        // Clear previous alerts
        alertsList.innerHTML = '';
        
        if (alerts.length > 0) {
            // Hide no alerts message and show alerts list
            noAlertsMessage.classList.add('d-none');
            alertsList.classList.remove('d-none');
            
            // Create alert items
            alerts.forEach(alert => {
                const severity = window.weatherService.getAlertSeverity(alert);
                const alertItem = document.createElement('div');
                alertItem.className = `weather-alert ${severity}`;
                
                const startTime = window.weatherService.formatDateTime(alert.start);
                const endTime = window.weatherService.formatDateTime(alert.end);
                
                alertItem.innerHTML = `
                    <h5>${alert.event}</h5>
                    <p>${alert.description}</p>
                    <div class="alert-time">
                        <strong>From:</strong> ${startTime}<br>
                        <strong>To:</strong> ${endTime}
                    </div>
                `;
                
                alertsList.appendChild(alertItem);
            });
            
            // Show notification for new alerts if enabled
            if (Notification.permission === 'granted') {
                this.showAlertNotifications(alerts);
            }
        } else {
            // Show no alerts message and hide alerts list
            noAlertsMessage.classList.remove('d-none');
            alertsList.classList.add('d-none');
        }
    }
    
    /**
     * Show notifications for weather alerts
     * @param {Array} alerts - Array of weather alerts
     */
    showAlertNotifications(alerts) {
        if (!alerts || alerts.length === 0) {
            return;
        }
        
        // Get previously shown alerts from localStorage
        const shownAlerts = JSON.parse(localStorage.getItem('shownAlerts') || '[]');
        
        // Filter out alerts that have already been shown
        const newAlerts = alerts.filter(alert => {
            const alertId = `${alert.event}-${alert.start}-${alert.end}`;
            return !shownAlerts.includes(alertId);
        });
        
        if (newAlerts.length === 0) {
            return;
        }
        
        // Show notifications for new alerts
        newAlerts.forEach(alert => {
            const severity = window.weatherService.getAlertSeverity(alert);
            const title = `${severity.toUpperCase()} Weather Alert: ${alert.event}`;
            const options = {
                body: alert.description,
                icon: '/favicon.ico', // Add a favicon to your project
                tag: `weather-alert-${alert.start}`,
                requireInteraction: severity === 'severe' // Keep severe alerts until user interacts
            };
            
            // Show notification
            const notification = new Notification(title, options);
            
            // Close notification after duration (except for severe alerts)
            if (severity !== 'severe') {
                setTimeout(() => {
                    notification.close();
                }, CONFIG.ALERTS.NOTIFICATION_DURATION);
            }
            
            // Add to shown alerts
            const alertId = `${alert.event}-${alert.start}-${alert.end}`;
            shownAlerts.push(alertId);
        });
        
        // Save shown alerts to localStorage
        localStorage.setItem('shownAlerts', JSON.stringify(shownAlerts));
    }
    
    /**
     * Start checking for alerts periodically
     */
    startAlertChecking() {
        // Clear existing interval
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
        }
        
        // Set up new interval
        this.alertCheckInterval = setInterval(async () => {
            if (this.currentLocation && this.alertsToggle.checked) {
                try {
                    // Get latest alert data
                    const oneCallData = await weatherService.getOneCallData(this.currentLocation);
                    const alerts = oneCallData.alerts || [];
                    
                    // Update stored alerts
                    this.weatherData.alerts = alerts;
                    
                    // Process alerts
                    this.processAlerts();
                } catch (error) {
                    console.error('Error checking for alerts:', error);
                }
            }
        }, CONFIG.ALERTS.CHECK_INTERVAL);
    }
    
    /**
     * Toggle alerts for current location
     * @param {boolean} enabled - Whether alerts are enabled
     */
    toggleAlerts(enabled) {
        if (enabled) {
            // Start checking for alerts
            this.startAlertChecking();
        } else {
            // Stop checking for alerts
            if (this.alertCheckInterval) {
                clearInterval(this.alertCheckInterval);
                this.alertCheckInterval = null;
            }
        }
    }
    
    /**
     * Set up auto refresh of weather data
     */
    setupAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        // Set up new timer
        this.refreshTimer = setTimeout(() => {
            if (this.currentLocation) {
                this.fetchWeatherData();
            }
        }, CONFIG.DEFAULTS.REFRESH_INTERVAL);
    }
    
    /**
     * Save current location to localStorage
     */
    saveLocation() {
        if (this.currentLocation) {
            localStorage.setItem('weatherLocation', JSON.stringify(this.currentLocation));
        }
    }
    
    /**
     * Load saved location from localStorage
     */
    loadSavedLocation() {
        const savedLocation = localStorage.getItem('weatherLocation');
        
        if (savedLocation) {
            try {
                this.currentLocation = JSON.parse(savedLocation);
                this.fetchWeatherData();
            } catch (error) {
                console.error('Error loading saved location:', error);
                localStorage.removeItem('weatherLocation');
            }
        }
    }
    
    /**
     * Load a saved location from user's saved locations
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     */
    loadSavedLocation(lat, lon) {
        if (!lat || !lon) return;
        
        this.showLoading();
        
        // Get location details
        window.weatherService.reverseGeocode(lat, lon)
            .then(locationData => {
                this.currentLocation = {
                    lat,
                    lon,
                    name: locationData.name,
                    country: locationData.country
                };
                
                // Save as current location
                this.saveLocation();
                
                // Fetch weather data
                return this.fetchWeatherData();
            })
            .catch(error => {
                this.showError(error.message);
                this.hideLoading();
            });
    }
    
    /**
     * Apply theme to the application
     * @param {string} theme - Theme to apply ('light' or 'dark')
     */
    applyTheme(theme) {
        // Set theme attribute on html element
        document.documentElement.setAttribute('data-bs-theme', theme);
        
        // Store current theme
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Update charts if they exist
        if (window.chartsService) {
            window.chartsService.updateChartColors();
        }
    }
    
    /**
     * Update hourly forecast section
     */
    updateHourlyForecast() {
        const hourlyContainer = document.getElementById('hourlyForecastItems');
        hourlyContainer.innerHTML = '';
        
        // Get hourly data (limit to CONFIG.UI.MAX_HOURLY_FORECAST hours)
        const hourlyData = this.weatherData.hourly.slice(0, CONFIG.UI.MAX_HOURLY_FORECAST);
        
        // Create hourly forecast items
        hourlyData.forEach(hour => {
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'col hourly-item';
            
            const time = new Date(hour.dt * 1000);
            const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const iconUrl = window.weatherService.getIconUrl(hour.weather[0].icon, 2);
            const temp = window.weatherService.formatTemperature(hour.temp);
            const description = hour.weather[0].description;
            
            hourlyItem.innerHTML = `
                <div class="hourly-time">${formattedTime}</div>
                <img src="${iconUrl}" alt="${description}" class="hourly-icon">
                <div class="hourly-temp">${temp}</div>
                <div class="hourly-desc">${description}</div>
            `;
            
            hourlyContainer.appendChild(hourlyItem);
        });
        
        // Show or hide based on toggle state
        if (document.getElementById('hourlyForecastToggle').checked) {
            this.hourlyForecastContainer.classList.remove('d-none');
        } else {
            this.hourlyForecastContainer.classList.add('d-none');
        }
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        this.loadingIndicator.classList.remove('d-none');
        this.errorMessage.classList.add('d-none');
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loadingIndicator.classList.add('d-none');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('d-none');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            this.errorMessage.classList.add('d-none');
        }, 5000);
    }
}