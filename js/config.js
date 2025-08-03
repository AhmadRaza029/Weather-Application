/**
 * Configuration file for Weather Application
 * Contains API keys and other configuration settings
 */

const CONFIG = {
    // OpenWeatherMap API configuration
    // You need to replace this with your actual API key from https://openweathermap.org/
    WEATHER_API_KEY: '2d6185ce67da5b9bd63fbe025eaa7f62',
    
    // API endpoints
    ENDPOINTS: {
        CURRENT_WEATHER: 'https://api.openweathermap.org/data/2.5/weather',
        FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
        ONECALL: 'https://api.openweathermap.org/data/2.5/onecall', // Using free tier OneCall 2.5
        GEOCODING: 'https://api.openweathermap.org/geo/1.0/direct',
        REVERSE_GEOCODING: 'https://api.openweathermap.org/geo/1.0/reverse',
        ICONS: 'https://openweathermap.org/img/wn/',
        WEATHER_MAPS: 'https://tile.openweathermap.org/map/',
        RADAR: 'https://api.rainviewer.com/public/weather-maps.json'
    },
    
    // Default settings
    DEFAULTS: {
        UNITS: 'metric', // Options: 'metric' (Celsius), 'imperial' (Fahrenheit), 'standard' (Kelvin)
        LANGUAGE: 'en',   // Language code for API responses
        LOCATION: {       // Default location if geolocation fails
            lat: 40.7128,
            lon: -74.0060,
            name: 'New York'
        },
        REFRESH_INTERVAL: 30 * 60 * 1000, // Auto-refresh interval in milliseconds (30 minutes)
    },
    
    // Alert settings
    ALERTS: {
        ENABLED: true,                // Enable/disable alerts by default
        CHECK_INTERVAL: 15 * 60 * 1000, // Check for new alerts every 15 minutes
        NOTIFICATION_DURATION: 10000,   // How long notifications stay visible (in milliseconds)
        SEVERITY_LEVELS: {             // Severity level classifications
            SEVERE: ['Hurricane', 'Tornado', 'Extreme Thunderstorm', 'Flood', 'Tsunami'],
            MODERATE: ['Thunderstorm', 'Rain', 'Snow', 'Fog', 'Wind'],
            MINOR: ['Cloudy', 'Drizzle', 'Light Rain']
        }
    },
    
    // UI settings
    UI: {
        THEME: 'light',              // 'light' or 'dark'
        ANIMATION_ENABLED: true,      // Enable/disable UI animations
        MAX_FORECAST_DAYS: 5,         // Number of forecast days to display
        MAX_HOURLY_FORECAST: 24,      // Number of hourly forecast hours to display
        TEMPERATURE_DECIMAL_PLACES: 1, // Number of decimal places for temperature display
        ENABLE_MAPS: true,            // Enable/disable weather maps
        DEFAULT_MAP_TYPE: 'precipitation', // Default map type (precipitation, temp, clouds, etc.)
        MAP_ZOOM_LEVEL: 5,            // Default map zoom level
        VISUALIZATION_TYPE: 'chart',   // Default visualization type (chart, gauge, etc.)
        SAVED_LOCATIONS_LIMIT: 5      // Maximum number of saved locations per user
    },
    
    // User account settings
    USER: {
        ENABLE_ACCOUNTS: true,        // Enable/disable user accounts
        STORAGE_TYPE: 'localStorage',  // Storage type for user data (localStorage, sessionStorage, etc.)
        DEFAULT_USERNAME: 'Guest',     // Default username for guest users
        SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000 // Session timeout in milliseconds (7 days)
    }
};

// Prevent accidental modification of configuration
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.DEFAULTS);
Object.freeze(CONFIG.ALERTS);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.DEFAULTS.LOCATION);
Object.freeze(CONFIG.ALERTS.SEVERITY_LEVELS);