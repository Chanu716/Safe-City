// config/maps-config.js - Google Maps configuration
// Replace 'YOUR_MAP_ID_HERE' with your actual Map ID from Google Cloud Console

const MAPS_CONFIG = {
    // Get this from Google Cloud Console > Google Maps Platform > Map Management
    mapId: '98d5fa934bb50a716a42b04c', // Your Safe-City Map ID
    
    // Default map settings
    defaultLocation: { lat: 40.7128, lng: -74.0060 }, // New York City - change to your preferred default
    defaultZoom: 13,
    
    // Map styling options
    mapOptions: {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        scaleControl: true
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAPS_CONFIG;
} else {
    window.MAPS_CONFIG = MAPS_CONFIG;
}