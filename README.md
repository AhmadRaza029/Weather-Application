# Weather Application

A responsive web application that delivers real-time, location-based weather updates with a user-friendly interface.

## Features

- **Real-time Weather Data**: Integration with OpenWeatherMap API to provide current and forecast weather information
- **Geolocation Support**: Automatically detects the user's location to display local weather
- **Search Functionality**: Search for weather information in any location worldwide
- **5-Day Forecast**: View upcoming weather conditions for better planning
- **Weather Alerts**: Receive notifications for severe weather conditions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Persistent Settings**: Remembers your last viewed location

## Technologies Used

- **HTML5**: Semantic markup for structure
- **CSS3**: Styling with modern CSS features
- **JavaScript**: ES6+ features for functionality
- **Bootstrap 5**: Responsive layout and UI components
- **Font Awesome**: Icons for enhanced user interface
- **OpenWeatherMap API**: Weather data provider
- **Geolocation API**: Browser-based location detection
- **Web Notifications API**: Browser notifications for weather alerts

## Setup and Usage

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- An OpenWeatherMap API key (get one for free at [OpenWeatherMap](https://openweathermap.org/api))

### Installation

1. Clone or download this repository
2. Open the `js/config.js` file and replace `'YOUR_OPENWEATHERMAP_API_KEY'` with your actual API key
3. Open `index.html` in your web browser

### Using the Application

1. **Current Location**: Click the "Use My Location" button to get weather for your current location (requires location permission)
2. **Search**: Enter a city name in the search box and press Enter or click the search button
3. **Weather Alerts**: Click "Enable Alerts" to receive notifications about severe weather conditions (requires notification permission)
4. **Forecast**: Scroll down to view the 5-day forecast

## Customization

You can customize various aspects of the application by modifying the `js/config.js` file:

- **Units**: Change between metric (Celsius), imperial (Fahrenheit), or standard (Kelvin)
- **Language**: Set your preferred language for weather descriptions
- **Default Location**: Configure a fallback location if geolocation fails
- **UI Settings**: Adjust theme, animations, and display preferences
- **Alert Settings**: Configure alert checking intervals and notification behavior

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons by [Font Awesome](https://fontawesome.com/)
- UI components from [Bootstrap](https://getbootstrap.com/)