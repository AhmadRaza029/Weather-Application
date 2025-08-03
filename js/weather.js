/**
 * Weather API Service
 * Handles all interactions with the OpenWeatherMap API
 */

class WeatherService {
    constructor() {
        this.apiKey = CONFIG.WEATHER_API_KEY;
        this.units = CONFIG.DEFAULTS.UNITS;
        this.language = CONFIG.DEFAULTS.LANGUAGE;
    }

    /**
     * Get current weather data for a location
     * @param {Object} location - Location object with lat and lon properties
     * @returns {Promise} - Promise that resolves to weather data
     */
    async getCurrentWeather(location) {
        try {
            const url = new URL(CONFIG.ENDPOINTS.CURRENT_WEATHER);
            url.searchParams.append('lat', location.lat);
            url.searchParams.append('lon', location.lon);
            url.searchParams.append('units', this.units);
            url.searchParams.append('lang', this.language);
            url.searchParams.append('appid', this.apiKey);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching current weather:', error);
            throw error;
        }
    }

    /**
     * Get 5-day weather forecast for a location
     * @param {Object} location - Location object with lat and lon properties
     * @returns {Promise} - Promise that resolves to forecast data
     */
    async getForecast(location) {
        try {
            const url = new URL(CONFIG.ENDPOINTS.FORECAST);
            url.searchParams.append('lat', location.lat);
            url.searchParams.append('lon', location.lon);
            url.searchParams.append('units', this.units);
            url.searchParams.append('lang', this.language);
            url.searchParams.append('appid', this.apiKey);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Forecast API error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive weather data including alerts using OneCall API
     * @param {Object} location - Location object with lat and lon properties
     * @param {boolean} includeHourly - Whether to include hourly forecast data
     * @returns {Promise} - Promise that resolves to OneCall API data
     */
    async getOneCallData(location, includeHourly = true) {
        try {
            const url = new URL(CONFIG.ENDPOINTS.ONECALL);
            url.searchParams.append('lat', location.lat);
            url.searchParams.append('lon', location.lon);
            url.searchParams.append('units', this.units);
            url.searchParams.append('lang', this.language);
            url.searchParams.append('appid', this.apiKey);
            
            // Only exclude minutely data, keep hourly if requested
            const exclude = includeHourly ? 'minutely' : 'minutely,hourly';
            url.searchParams.append('exclude', exclude);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OneCall API error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching OneCall data:', error);
            throw error;
        }
    }

    /**
     * Search for a location by city name
     * @param {string} cityName - Name of the city to search for
     * @returns {Promise} - Promise that resolves to location data
     */
    async searchLocation(cityName) {
        try {
            const url = new URL(CONFIG.ENDPOINTS.GEOCODING);
            url.searchParams.append('q', cityName);
            url.searchParams.append('limit', 5); // Get up to 5 matching locations
            url.searchParams.append('appid', this.apiKey);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
                throw new Error(`No locations found for "${cityName}"`);
            }
            
            return data;
        } catch (error) {
            console.error('Error searching location:', error);
            throw error;
        }
    }

    /**
     * Get location data from coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise} - Promise that resolves to location data
     */
    async reverseGeocode(lat, lon) {
        try {
            const url = new URL(CONFIG.ENDPOINTS.REVERSE_GEOCODING);
            url.searchParams.append('lat', lat);
            url.searchParams.append('lon', lon);
            url.searchParams.append('limit', 1);
            url.searchParams.append('appid', this.apiKey);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
                throw new Error('No location data found for these coordinates');
            }
            
            return data[0];
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            throw error;
        }
    }

    /**
     * Get weather icon URL
     * @param {string} iconCode - Weather icon code from API
     * @param {number} size - Size multiplier (1 for small, 2 for medium, 4 for large)
     * @returns {string} - URL to weather icon
     */
    getIconUrl(iconCode, size = 2) {
        return `${CONFIG.ENDPOINTS.ICONS}${iconCode}@${size}x.png`;
    }

    /**
     * Format temperature based on units
     * @param {number} temp - Temperature value
     * @returns {string} - Formatted temperature with unit
     */
    formatTemperature(temp) {
        if (!temp && temp !== 0) return '--';
        
        const roundedTemp = Number(temp).toFixed(CONFIG.UI.TEMPERATURE_DECIMAL_PLACES);
        
        switch (this.units) {
            case 'imperial':
                return `${roundedTemp}°F`;
            case 'metric':
                return `${roundedTemp}°C`;
            default: // standard (Kelvin)
                return `${roundedTemp}K`;
        }
    }

    /**
     * Format wind speed based on units
     * @param {number} speed - Wind speed value
     * @returns {string} - Formatted wind speed with unit
     */
    formatWindSpeed(speed) {
        if (!speed && speed !== 0) return '--';
        
        switch (this.units) {
            case 'imperial':
                return `${speed.toFixed(1)} mph`;
            default: // metric and standard
                return `${speed.toFixed(1)} m/s`;
        }
    }

    /**
     * Format date and time
     * @param {number} timestamp - Unix timestamp
     * @param {string} format - Format type ('date', 'time', 'datetime', 'day')
     * @returns {string} - Formatted date/time string
     */
    formatDateTime(timestamp, format = 'datetime') {
        if (!timestamp) return '--';
        
        const date = new Date(timestamp * 1000);
        
        switch (format) {
            case 'date':
                return date.toLocaleDateString(this.language, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            case 'time':
                return date.toLocaleTimeString(this.language, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'day':
                return date.toLocaleDateString(this.language, { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
            default: // datetime
                return date.toLocaleString(this.language, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
        }
    }

    /**
     * Determine severity level of a weather alert
     * @param {Object} alert - Weather alert object
     * @returns {string} - Severity level ('severe', 'moderate', 'minor')
     */
    getAlertSeverity(alert) {
        const event = alert.event.toLowerCase();
        const description = alert.description.toLowerCase();
        
        // Check against configured severity levels
        for (const [level, keywords] of Object.entries(CONFIG.ALERTS.SEVERITY_LEVELS)) {
            for (const keyword of keywords) {
                if (event.includes(keyword.toLowerCase()) || 
                    description.includes(keyword.toLowerCase())) {
                    return level.toLowerCase();
                }
            }
        }
        
        // Default to moderate if no match found
        return 'moderate';
    }
    
    /**
     * Get weather map tile URL
     * @param {string} mapType - Type of map (precipitation, temp, clouds, etc.)
     * @param {number} zoom - Zoom level (0-9)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string} - URL to weather map tile
     */
    getMapTileUrl(mapType = 'precipitation_new', zoom = 5, x = 0, y = 0) {
        return `${CONFIG.ENDPOINTS.WEATHER_MAPS}${mapType}/${zoom}/${x}/${y}.png?appid=${this.apiKey}`;
    }

    /**
     * Get radar data from RainViewer API
     * @returns {Promise} - Promise that resolves to radar data
     */
    async getRadarData() {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.RADAR);
            
            if (!response.ok) {
                throw new Error(`Radar API error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching radar data:', error);
            throw error;
        }
    }

    /**
     * Get radar image URL
     * @param {Object} radarData - Radar data from RainViewer API
     * @param {number} frameIndex - Frame index
     * @param {number} zoom - Zoom level
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string} - URL to radar image
     */
    getRadarImageUrl(radarData, frameIndex = 0, zoom = 5, x = 0, y = 0) {
        if (!radarData || !radarData.radar || !radarData.radar.past || !radarData.radar.past[frameIndex]) {
            return null;
        }
        
        const frame = radarData.radar.past[frameIndex];
        return `${radarData.host}${frame.path}/${zoom}/${x}/${y}/0/0_0.png`;
    }
}

// The service will be initialized in app.js