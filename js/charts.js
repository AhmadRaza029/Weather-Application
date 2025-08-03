/**
 * Weather Charts Service
 * Handles weather data visualizations
 */

class ChartsService {
    constructor() {
        this.temperatureChart = null;
        this.humidityPressureChart = null;
        this.visualizationType = CONFIG.UI.VISUALIZATION_TYPE;
        
        // Initialize charts
        this.init();
    }
    
    /**
     * Initialize charts service
     */
    init() {
        // Note: Visualization type toggle is not implemented in the HTML yet
        // We'll use the default visualization type from config
    }
    
    /**
     * Update charts with new weather data
     * @param {Object} weatherData - Weather data from API
     */
    updateCharts(weatherData) {
        if (!weatherData) {
            return;
        }
        
        // Determine which data to use based on visualization type
        if (this.visualizationType === '24h' && weatherData.hourly) {
            this.createHourlyCharts(weatherData.hourly);
        } else if (weatherData.daily) {
            this.createDailyCharts(weatherData.daily);
        }
    }
    
    /**
     * Create charts for hourly forecast data
     * @param {Array} hourlyData - Hourly forecast data
     */
    createHourlyCharts(hourlyData) {
        // Limit to 24 hours
        const data = hourlyData.slice(0, 24);
        
        // Prepare data for temperature chart
        const tempLabels = data.map(hour => {
            const date = new Date(hour.dt * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        const tempData = data.map(hour => {
            return weatherService.formatTemperature(hour.temp, false);
        });
        
        const feelsLikeData = data.map(hour => {
            return weatherService.formatTemperature(hour.feels_like, false);
        });
        
        // Create temperature chart
        this.createTemperatureChart(tempLabels, tempData, feelsLikeData);
        
        // Prepare data for humidity/pressure chart
        const humidityData = data.map(hour => hour.humidity);
        const pressureData = data.map(hour => hour.pressure / 10); // Scale down to fit better with humidity
        
        // Create humidity/pressure chart
        this.createHumidityPressureChart(tempLabels, humidityData, pressureData);
    }
    
    /**
     * Create charts for daily forecast data
     * @param {Array} dailyData - Daily forecast data
     */
    createDailyCharts(dailyData) {
        // Prepare data for temperature chart
        const tempLabels = dailyData.map(day => {
            const date = new Date(day.dt * 1000);
            return weatherService.formatDateTime(date, 'day');
        });
        
        const maxTempData = dailyData.map(day => {
            return weatherService.formatTemperature(day.temp.max, false);
        });
        
        const minTempData = dailyData.map(day => {
            return weatherService.formatTemperature(day.temp.min, false);
        });
        
        // Create temperature chart
        this.createTemperatureChart(tempLabels, maxTempData, minTempData, 'Max', 'Min');
        
        // Prepare data for humidity/pressure chart
        const humidityData = dailyData.map(day => day.humidity);
        const pressureData = dailyData.map(day => day.pressure / 10); // Scale down to fit better with humidity
        
        // Create humidity/pressure chart
        this.createHumidityPressureChart(tempLabels, humidityData, pressureData);
    }
    
    /**
     * Create or update temperature chart
     * @param {Array} labels - X-axis labels (times or days)
     * @param {Array} tempData - Temperature data
     * @param {Array} secondaryTempData - Secondary temperature data (feels like or min temp)
     * @param {string} primaryLabel - Label for primary data series
     * @param {string} secondaryLabel - Label for secondary data series
     */
    createTemperatureChart(labels, tempData, secondaryTempData, primaryLabel = 'Temp', secondaryLabel = 'Feels Like') {
        const ctx = document.getElementById('temperatureChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.temperatureChart) {
            this.temperatureChart.destroy();
        }
        
        // Get theme colors
        const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        const textColor = isDarkMode ? '#f8f9fa' : '#212529';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Create new chart
        this.temperatureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: primaryLabel,
                        data: tempData,
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: secondaryLabel,
                        data: secondaryTempData,
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        },
                        title: {
                            display: true,
                            text: CONFIG.UI.UNITS === 'metric' ? 'Temperature (°C)' : 'Temperature (°F)',
                            color: textColor
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create or update humidity/pressure chart
     * @param {Array} labels - X-axis labels (times or days)
     * @param {Array} humidityData - Humidity data
     * @param {Array} pressureData - Pressure data
     */
    createHumidityPressureChart(labels, humidityData, pressureData) {
        const ctx = document.getElementById('humidityPressureChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.humidityPressureChart) {
            this.humidityPressureChart.destroy();
        }
        
        // Get theme colors
        const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        const textColor = isDarkMode ? '#f8f9fa' : '#212529';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Create new chart
        this.humidityPressureChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Humidity (%)',
                        data: humidityData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Pressure (hPa)',
                        data: pressureData,
                        type: 'line',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: gridColor
                        },
                        title: {
                            display: true,
                            text: 'Humidity (%)',
                            color: textColor
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return (value * 10) + ' hPa';
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                            color: gridColor
                        },
                        title: {
                            display: true,
                            text: 'Pressure (hPa)',
                            color: textColor
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Update chart colors based on theme
     */
    updateChartColors() {
        // Update charts if they exist
        if (this.temperatureChart || this.humidityPressureChart) {
            // Get current weather data and update charts
            if (app.weatherData) {
                this.updateCharts(app.weatherData);
            }
        }
    }
}

// The service will be initialized in app.js