// Report.js - Incident Reporting Functionality

let map;
let marker;
let selectedLocation = null;

// Initialize the map
function initMap() {
    // Use configuration from maps-config.js
    const config = window.MAPS_CONFIG || {};
    const defaultLocation = config.defaultLocation || { lat: 40.7128, lng: -74.0060 };
    
    const mapOptions = {
        zoom: config.defaultZoom || 13,
        center: defaultLocation,
        ...config.mapOptions,
        mapId: config.mapId || 'DEMO_MAP_ID' // Will use your Map ID when configured
    };
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    // Add click listener to map
    map.addListener('click', (event) => {
        placeMarker(event.latLng);
    });

    // Try to get user's current location
    getCurrentLocation();
}
window.initMap = initMap;

// Get user's current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setCenter(userLocation);
                placeMarker(new google.maps.LatLng(userLocation.lat, userLocation.lng));
                
                document.getElementById('location-status').innerHTML = 
                    '<div class="alert alert-success">📍 Current location detected</div>';
            },
            (error) => {
                console.error('Error getting location:', error);
                document.getElementById('location-status').innerHTML = 
                    '<div class="alert alert-warning">⚠️ Location access denied. Please click on the map to select location.</div>';
            }
        );
    } else {
        document.getElementById('location-status').innerHTML = 
            '<div class="alert alert-warning">⚠️ Geolocation not supported. Please click on the map to select location.</div>';
    }
}

// Place marker on map
function placeMarker(location) {
    // Remove existing marker
    if (marker) {
        marker.map = null;
    }
    
    // Create new marker using AdvancedMarkerElement if available and Map ID is configured
    const config = window.MAPS_CONFIG || {};
    const hasValidMapId = config.mapId && config.mapId !== 'YOUR_MAP_ID_HERE' && config.mapId !== 'DEMO_MAP_ID';
    
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement && hasValidMapId) {
        marker = new google.maps.marker.AdvancedMarkerElement({
            position: location,
            map: map,
            gmpDraggable: true
        });
    } else {
        // Fallback to legacy Marker for compatibility
        marker = new google.maps.Marker({
            position: location,
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP
        });
    }
    
    // Store selected location
    selectedLocation = {
        lat: location.lat(),
        lng: location.lng()
    };
    
    // Update location display
    document.getElementById('selected-location').innerHTML = 
        `📍 Selected: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
    
    // Add drag listener (works for both AdvancedMarkerElement and classic Marker)
    marker.addListener('dragend', (event) => {
        // For AdvancedMarkerElement, position is directly accessible
        // For classic Marker, use event.latLng
        const position = event.latLng || marker.position;
        selectedLocation = {
            lat: position.lat(),
            lng: position.lng()
        };
        document.getElementById('selected-location').innerHTML = 
            `📍 Selected: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
    });
}

// Use current location button
function useCurrentLocation() {
    document.getElementById('location-btn').innerHTML = '<span class="loading"></span>';
    getCurrentLocation();
    setTimeout(() => {
        document.getElementById('location-btn').innerHTML = '📍 Use Current Location';
    }, 2000);
}

// Submit incident report
async function submitReport(event) {
    event.preventDefault();
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        showAlert('Please log in to report incidents', 'danger');
        window.location.href = 'login.html';
        return;
    }
    
    // Get the current auth token
    const currentAuthToken = localStorage.getItem('safecity_token');

    
    if (!currentAuthToken) {
        showAlert('Authentication token not found. Please log in again.', 'danger');
        window.location.href = 'login.html';
        return;
    }
    
    // Basic token validation
    if (currentAuthToken.split('.').length !== 3) {
        console.log('Invalid token format - clearing and redirecting to login');
        localStorage.removeItem('safecity_token');
        localStorage.removeItem('safecity_user');
        showAlert('Invalid authentication token. Please log in again.', 'danger');
        window.location.href = 'login.html';
        return;
    }
    
    // Check if token is expired
    try {
        const tokenPayload = JSON.parse(atob(currentAuthToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            console.log('Token expired - clearing and redirecting to login');
            localStorage.removeItem('safecity_token');
            localStorage.removeItem('safecity_user');
            showAlert('Your session has expired. Please log in again.', 'warning');
            window.location.href = 'login.html';
            return;
        }
    } catch (tokenParseError) {
        console.log('Error parsing token - clearing and redirecting to login');
        localStorage.removeItem('safecity_token');
        localStorage.removeItem('safecity_user');
        showAlert('Invalid authentication token. Please log in again.', 'danger');
        window.location.href = 'login.html';
        return;
    }
    
    // Check if location is selected
    if (!selectedLocation) {
        showAlert('Please select a location on the map', 'danger');
        return;
    }
    
    // Validate consent checkboxes
    const dataConsent = document.getElementById('dataConsent');
    const accuracyConfirm = document.getElementById('accuracyConfirm');
    
    if (!dataConsent.checked) {
        showAlert('You must consent to data processing to submit a report', 'danger');
        return;
    }
    
    if (!accuracyConfirm.checked) {
        showAlert('You must confirm the accuracy of your report', 'danger');
        return;
    }
    
    // Get form data
    const formData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        timestamp: new Date().toISOString(),
        anonymous: document.getElementById('anonymousReport').checked
    };
    
    // Validate form
    if (!formData.title || !formData.category || !formData.description) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        // Show loading
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
        submitBtn.disabled = true;
        
        // Send to backend
        const apiUrl = '/api/incidents';
            
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAuthToken}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showPopup('Report submitted successfully!');
            showAlert('Incident reported successfully! Your report is being reviewed and will be published after moderation. Thank you for helping keep the community safe.', 'success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Reset form
            document.getElementById('report-form').reset();
            // Reset consent checkboxes
            dataConsent.checked = false;
            accuracyConfirm.checked = false;
            document.getElementById('anonymousReport').checked = false;
            if (marker) {
                marker.setMap(null);
            }
            selectedLocation = null;
            document.getElementById('selected-location').innerHTML = '';
        } else {
            const result = await response.json();
            console.error('API Error:', result);
            console.error('Response status:', response.status);
            console.error('Response headers:', response.headers);
            
            // Handle authentication errors specifically
            if (response.status === 401) {
                console.log('Authentication error - clearing stored credentials');
                localStorage.removeItem('safecity_token');
                localStorage.removeItem('safecity_user');
                if (typeof clearAuthData === 'function') {
                    clearAuthData();
                }
                showAlert('Your session has expired. Please log in again.', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            throw new Error(result.error || `Failed to submit report (Status: ${response.status})`);
        }
        
    } catch (error) {
        console.error('Error submitting report:', error);
        showAlert('Failed to submit report. Please try again.', 'danger');
    } finally {
        // Restore button
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.innerHTML = '🚨 Submit Report';
        submitBtn.disabled = false;
    }
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    const container = document.querySelector('.form-container');
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Show popup message
function showPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup-success';
    popup.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%);background:#fff;border-radius:8px;padding:1rem 2rem;box-shadow:0 2px 12px rgba(0,0,0,0.12);z-index:2000;font-size:1.2rem;color:#155724;border:2px solid #c3e6cb;';
    popup.innerHTML = `<span>✅ ${message}</span>`;
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 3000);
}

// Toggle manual coordinate input
// Toggle manual location input
function toggleManualLocation() {
    const manualDiv = document.getElementById('manual-location');
    if (manualDiv.style.display === 'none' || manualDiv.style.display === '') {
        manualDiv.style.display = 'block';
    } else {
        manualDiv.style.display = 'none';
    }
}

// Use manual location (geocode)
function useManualLocation() {
    const locationInput = document.getElementById('location-search').value.trim();
    if (!locationInput) {
        showAlert('Please enter a location to search.', 'error');
        return;
    }
    // Use Google Maps Geocoding API if available
    if (window.google && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: locationInput }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const loc = results[0].geometry.location;
                selectedLocation = { lat: loc.lat(), lng: loc.lng() };
                document.getElementById('selected-location').innerHTML =
                    `📍 Location: ${results[0].formatted_address} (${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)})`;
                if (map) {
                    placeMarker(loc);
                    map.setCenter(loc);
                }
                showAlert('Location set successfully!', 'success');
                document.getElementById('manual-location').style.display = 'none';
            } else {
                showAlert('Location not found. Please try a different search.', 'error');
            }
        });
    } else {
        showAlert('Map/geocoding service unavailable. Please use the map or current location.', 'error');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    document.getElementById('location-btn').addEventListener('click', useCurrentLocation);
    document.getElementById('report-form').addEventListener('submit', submitReport);
    
    // Auto-fill timestamp
    const now = new Date();
    const timestamp = now.toLocaleString();
    document.getElementById('timestamp-display').innerHTML = `⏰ ${timestamp}`;
    

});
