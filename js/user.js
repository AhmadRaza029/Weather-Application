/**
 * User Management Service
 * Handles user authentication and saved locations
 */

class UserService {
    constructor() {
        this.storageType = CONFIG.USER.STORAGE_TYPE;
        this.currentUser = null;
        this.savedLocations = [];
        
        // Initialize user data
        this.init();
    }
    
    /**
     * Initialize user service
     */
    init() {
        // Check if user is already logged in
        this.loadUserData();
        
        // Set up event listeners for auth modals
        this.setupEventListeners();
        
        // Update UI based on auth state
        this.updateAuthUI();
    }
    
    /**
     * Set up event listeners for authentication
     */
    setupEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        });
        
        // Register button
        document.getElementById('registerBtn').addEventListener('click', () => {
            const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
            registerModal.show();
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Switch between login and register
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            setTimeout(() => {
                const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
                registerModal.show();
            }, 500);
        });
        
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();
            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 500);
        });
        
        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.login(email, password);
        });
        
        // Register form submission
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            this.register(name, email, password);
        });
        
        // Save location button
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'saveLocationBtn') {
                if (!this.currentUser) {
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                    return;
                }
                
                const saveLocationModal = new bootstrap.Modal(document.getElementById('saveLocationModal'));
                document.getElementById('saveLocationName').textContent = app.currentLocation.name;
                saveLocationModal.show();
            }
        });
        
        // Confirm save location
        document.getElementById('confirmSaveLocation').addEventListener('click', () => {
            this.saveLocation(app.currentLocation);
            const saveLocationModal = bootstrap.Modal.getInstance(document.getElementById('saveLocationModal'));
            saveLocationModal.hide();
        });
    }
    
    /**
     * Register a new user
     * @param {string} name - User's name
     * @param {string} email - User's email
     * @param {string} password - User's password
     */
    register(name, email, password) {
        // In a real app, this would make an API call to register the user
        // For this demo, we'll just store the user in localStorage
        
        // Check if user already exists
        const users = this.getStoredItem('users') || [];
        const existingUser = users.find(user => user.email === email);
        
        if (existingUser) {
            alert('User with this email already exists');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, // In a real app, this would be hashed
            savedLocations: []
        };
        
        // Add user to users array
        users.push(newUser);
        this.setStoredItem('users', users);
        
        // Log in the new user
        this.login(email, password);
        
        // Close register modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();
    }
    
    /**
     * Log in a user
     * @param {string} email - User's email
     * @param {string} password - User's password
     */
    login(email, password) {
        // In a real app, this would make an API call to authenticate the user
        // For this demo, we'll just check localStorage
        
        const users = this.getStoredItem('users') || [];
        const user = users.find(user => user.email === email && user.password === password);
        
        if (!user) {
            alert('Invalid email or password');
            return;
        }
        
        // Set current user
        this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        // Load saved locations
        this.savedLocations = user.savedLocations || [];
        
        // Save user data to storage
        this.setStoredItem('currentUser', this.currentUser);
        
        // Update UI
        this.updateAuthUI();
        
        // Close login modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
    }
    
    /**
     * Log out the current user
     */
    logout() {
        this.currentUser = null;
        this.savedLocations = [];
        this.removeStoredItem('currentUser');
        this.updateAuthUI();
    }
    
    /**
     * Save a location for the current user
     * @param {Object} location - Location to save
     */
    saveLocation(location) {
        if (!this.currentUser || !location) {
            return;
        }
        
        // Check if location is already saved
        const existingLocation = this.savedLocations.find(loc => 
            loc.lat === location.lat && loc.lon === location.lon);
        
        if (existingLocation) {
            alert('This location is already saved');
            return;
        }
        
        // Check if user has reached the limit
        if (this.savedLocations.length >= CONFIG.UI.SAVED_LOCATIONS_LIMIT) {
            alert(`You can only save up to ${CONFIG.UI.SAVED_LOCATIONS_LIMIT} locations. Please remove one first.`);
            return;
        }
        
        // Add location to saved locations
        this.savedLocations.push({
            id: Date.now().toString(),
            name: location.name,
            country: location.country,
            lat: location.lat,
            lon: location.lon
        });
        
        // Update user's saved locations
        this.updateUserSavedLocations();
        
        // Update UI
        this.updateSavedLocationsUI();
    }
    
    /**
     * Remove a saved location
     * @param {string} locationId - ID of location to remove
     */
    removeLocation(locationId) {
        if (!this.currentUser) {
            return;
        }
        
        this.savedLocations = this.savedLocations.filter(location => location.id !== locationId);
        
        // Update user's saved locations
        this.updateUserSavedLocations();
        
        // Update UI
        this.updateSavedLocationsUI();
    }
    
    /**
     * Update the user's saved locations in storage
     */
    updateUserSavedLocations() {
        if (!this.currentUser) {
            return;
        }
        
        const users = this.getStoredItem('users') || [];
        const userIndex = users.findIndex(user => user.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].savedLocations = this.savedLocations;
            this.setStoredItem('users', users);
        }
    }
    
    /**
     * Load user data from storage
     */
    loadUserData() {
        this.currentUser = this.getStoredItem('currentUser');
        
        if (this.currentUser) {
            // Load saved locations
            const users = this.getStoredItem('users') || [];
            const user = users.find(user => user.id === this.currentUser.id);
            
            if (user) {
                this.savedLocations = user.savedLocations || [];
            }
        }
    }
    
    /**
     * Update UI based on authentication state
     */
    updateAuthUI() {
        const userDisplayName = document.getElementById('userDisplayName');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.currentUser) {
            userDisplayName.textContent = this.currentUser.name;
            loginBtn.parentElement.classList.add('d-none');
            registerBtn.parentElement.classList.add('d-none');
            logoutBtn.parentElement.classList.remove('d-none');
        } else {
            userDisplayName.textContent = CONFIG.USER.DEFAULT_USERNAME;
            loginBtn.parentElement.classList.remove('d-none');
            registerBtn.parentElement.classList.remove('d-none');
            logoutBtn.parentElement.classList.add('d-none');
        }
        
        this.updateSavedLocationsUI();
    }
    
    /**
     * Update saved locations UI
     */
    updateSavedLocationsUI() {
        const savedLocationsEmpty = document.getElementById('savedLocationsEmpty');
        const savedLocationsList = document.getElementById('savedLocationsList');
        
        // Clear list
        savedLocationsList.innerHTML = '';
        
        if (this.savedLocations.length === 0) {
            savedLocationsEmpty.classList.remove('d-none');
            return;
        }
        
        savedLocationsEmpty.classList.add('d-none');
        
        // Add saved locations to list
        this.savedLocations.forEach(location => {
            const item = document.createElement('li');
            item.innerHTML = `
                <a class="dropdown-item d-flex justify-content-between align-items-center saved-location" 
                   href="#" data-lat="${location.lat}" data-lon="${location.lon}">
                    <span>${location.name}, ${location.country}</span>
                    <button class="btn btn-sm btn-danger remove-location" data-location-id="${location.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </a>
            `;
            savedLocationsList.appendChild(item);
        });
        
        // Add event listeners for saved locations
        document.querySelectorAll('.saved-location').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.remove-location')) {
                    return; // Don't trigger location load when clicking remove button
                }
                
                e.preventDefault();
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                
                // Load weather for this location
                app.loadSavedLocation(lat, lon);
            });
        });
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-location').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const locationId = button.dataset.locationId;
                this.removeLocation(locationId);
            });
        });
    }
    
    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @returns {*} - Stored value
     */
    getStoredItem(key) {
        try {
            const item = window[this.storageType].getItem(`weather_app_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error getting ${key} from ${this.storageType}:`, error);
            return null;
        }
    }
    
    /**
     * Set item in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    setStoredItem(key, value) {
        try {
            window[this.storageType].setItem(`weather_app_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting ${key} in ${this.storageType}:`, error);
        }
    }
    
    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    removeStoredItem(key) {
        try {
            window[this.storageType].removeItem(`weather_app_${key}`);
        } catch (error) {
            console.error(`Error removing ${key} from ${this.storageType}:`, error);
        }
    }
}

// The service will be initialized in app.js