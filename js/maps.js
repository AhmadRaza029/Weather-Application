/**
 * Weather Maps Service
 * Handles weather maps and radar functionality
 */

class MapsService {
    constructor() {
        this.map = null;
        this.currentLayer = null;
        this.currentMapType = CONFIG.UI.DEFAULT_MAP_TYPE;
        this.mapZoom = CONFIG.UI.MAP_ZOOM_LEVEL;
        this.radarFrames = [];
        this.radarAnimationInterval = null;
        this.currentRadarFrame = 0;
        
        // Initialize maps if enabled
        if (CONFIG.UI.ENABLE_MAPS) {
            this.init();
        }
    }
    
    /**
     * Initialize maps service
     */
    init() {
        // Set up map container
        this.setupMapContainer();
        
        // Set up event listeners for map type buttons
        this.setupEventListeners();
    }
    
    /**
     * Set up the map container
     */
    setupMapContainer() {
        // Create map instance
        this.map = L.map('weatherMap').setView([0, 0], this.mapZoom);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
    }
    
    /**
     * Set up event listeners for map controls
     */
    setupEventListeners() {
        // Map type buttons
        document.querySelectorAll('.map-type-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const mapType = e.target.closest('.map-type-btn').dataset.mapType;
                this.setMapType(mapType);
                
                // Update active button
                document.querySelectorAll('.map-type-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.closest('.map-type-btn').classList.add('active');
            });
        });
        
        // Set initial active button
        const initialButton = document.querySelector(`.map-type-btn[data-map-type="${this.currentMapType}"]`);
        if (initialButton) {
            initialButton.classList.add('active');
        }
    }
    
    /**
     * Update the map for a new location
     * @param {Object} location - Location object with lat and lon
     */
    updateMap(location) {
        if (!this.map || !location) {
            return;
        }
        
        // Update map center
        this.map.setView([location.lat, location.lon], this.mapZoom);
        
        // Add a marker for the location
        L.marker([location.lat, location.lon])
            .addTo(this.map)
            .bindPopup(`<b>${location.name}, ${location.country}</b>`)
            .openPopup();
        
        // Update the current map layer
        this.setMapType(this.currentMapType);
        
        // Load radar data if radar is selected
        if (this.currentMapType === 'radar') {
            this.loadRadarData(location);
        }
    }
    
    /**
     * Set the map type and update the layer
     * @param {string} mapType - Type of map to display (precipitation, temperature, clouds, wind, radar)
     */
    setMapType(mapType) {
        // Store the current map type
        this.currentMapType = mapType;
        
        // Remove current layer if it exists
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
        
        // Stop radar animation if it's running
        if (this.radarAnimationInterval) {
            clearInterval(this.radarAnimationInterval);
            this.radarAnimationInterval = null;
        }
        
        // Get current location from app
        const location = app.currentLocation;
        if (!location) {
            return;
        }
        
        // Add new layer based on map type
        switch (mapType) {
            case 'precipitation':
                this.addPrecipitationLayer();
                break;
            case 'temperature':
                this.addTemperatureLayer();
                break;
            case 'clouds':
                this.addCloudsLayer();
                break;
            case 'wind':
                this.addWindLayer();
                break;
            case 'radar':
                this.loadRadarData(location);
                break;
            default:
                this.addPrecipitationLayer();
        }
    }
    
    /**
     * Add precipitation layer to the map
     */
    addPrecipitationLayer() {
        const url = weatherService.getMapTileUrl('precipitation_new');
        this.currentLayer = L.tileLayer(url, {
            attribution: 'Weather data © OpenWeatherMap',
            opacity: 0.6
        }).addTo(this.map);
    }
    
    /**
     * Add temperature layer to the map
     */
    addTemperatureLayer() {
        const url = weatherService.getMapTileUrl('temp_new');
        this.currentLayer = L.tileLayer(url, {
            attribution: 'Weather data © OpenWeatherMap',
            opacity: 0.6
        }).addTo(this.map);
    }
    
    /**
     * Add clouds layer to the map
     */
    addCloudsLayer() {
        const url = weatherService.getMapTileUrl('clouds_new');
        this.currentLayer = L.tileLayer(url, {
            attribution: 'Weather data © OpenWeatherMap',
            opacity: 0.6
        }).addTo(this.map);
    }
    
    /**
     * Add wind layer to the map
     */
    addWindLayer() {
        const url = weatherService.getMapTileUrl('wind_new');
        this.currentLayer = L.tileLayer(url, {
            attribution: 'Weather data © OpenWeatherMap',
            opacity: 0.6
        }).addTo(this.map);
    }
    
    /**
     * Load radar data for a location
     * @param {Object} location - Location object with lat and lon
     */
    async loadRadarData(location) {
        try {
            // Show loading indicator
            document.getElementById('mapLoading').classList.remove('d-none');
            
            // Get radar data from weather service
            const radarData = await weatherService.getRadarData();
            
            if (!radarData || !radarData.radar || !radarData.radar.past) {
                throw new Error('No radar data available');
            }
            
            // Process radar frames
            this.processRadarFrames(radarData, location);
            
            // Hide loading indicator
            document.getElementById('mapLoading').classList.add('d-none');
        } catch (error) {
            console.error('Error loading radar data:', error);
            document.getElementById('mapLoading').classList.add('d-none');
            
            // Show error message
            const mapContainer = document.getElementById('weatherMap');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'map-error';
            errorDiv.textContent = 'Radar data not available for this location';
            mapContainer.appendChild(errorDiv);
            
            // Remove error after 3 seconds
            setTimeout(() => {
                mapContainer.removeChild(errorDiv);
                // Switch to precipitation map as fallback
                this.setMapType('precipitation');
                document.querySelector('.map-type-btn[data-map-type="precipitation"]').classList.add('active');
                document.querySelector('.map-type-btn[data-map-type="radar"]').classList.remove('active');
            }, 3000);
        }
    }
    
    /**
     * Process radar frames and start animation
     * @param {Object} radarData - Radar data from API
     * @param {Object} location - Location object with lat and lon
     */
    processRadarFrames(radarData, location) {
        // Clear existing frames
        this.radarFrames = [];
        this.currentRadarFrame = 0;
        
        // Process past frames
        const pastFrames = radarData.radar.past;
        for (let i = 0; i < pastFrames.length; i++) {
            const frame = pastFrames[i];
            const url = weatherService.getRadarImageUrl(frame.path, frame.time);
            this.radarFrames.push({
                url,
                timestamp: frame.time,
                opacity: 0.6
            });
        }
        
        // Add nowcast frames if available
        if (radarData.radar.nowcast) {
            const nowcastFrames = radarData.radar.nowcast;
            for (let i = 0; i < nowcastFrames.length; i++) {
                const frame = nowcastFrames[i];
                const url = weatherService.getRadarImageUrl(frame.path, frame.time);
                this.radarFrames.push({
                    url,
                    timestamp: frame.time,
                    opacity: 0.6,
                    nowcast: true
                });
            }
        }
        
        // Start animation if we have frames
        if (this.radarFrames.length > 0) {
            this.startRadarAnimation();
        }
    }
    
    /**
     * Start radar animation
     */
    startRadarAnimation() {
        // Show first frame
        this.showRadarFrame(0);
        
        // Set up animation interval
        this.radarAnimationInterval = setInterval(() => {
            this.currentRadarFrame = (this.currentRadarFrame + 1) % this.radarFrames.length;
            this.showRadarFrame(this.currentRadarFrame);
        }, 500); // Change frame every 500ms
    }
    
    /**
     * Show a specific radar frame
     * @param {number} frameIndex - Index of the frame to show
     */
    showRadarFrame(frameIndex) {
        if (!this.radarFrames[frameIndex]) {
            return;
        }
        
        // Remove current layer if it exists
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
        }
        
        // Get frame data
        const frame = this.radarFrames[frameIndex];
        
        // Create image overlay
        const bounds = this.map.getBounds().pad(1.0); // Extend bounds to cover more area
        this.currentLayer = L.imageOverlay(frame.url, bounds, {
            opacity: frame.opacity
        }).addTo(this.map);
        
        // Update timestamp display
        const timestamp = new Date(frame.timestamp * 1000);
        const timeString = timestamp.toLocaleTimeString();
        const dateString = timestamp.toLocaleDateString();
        const nowcast = frame.nowcast ? ' (Forecast)' : '';
        
        document.getElementById('radarTimestamp').textContent = `${dateString} ${timeString}${nowcast}`;
    }
}

// The service will be initialized in app.js