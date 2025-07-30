// Report.js - Incident Reporting Functionality

let map;
let marker;
let selectedLocation = null;

// Initialize the map
function initMap() {
    // Default location (you can change this to your preferred default)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

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
        marker.setMap(null);
    }
    
    // Create new marker
    marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
    });
    
    // Store selected location
    selectedLocation = {
        lat: location.lat(),
        lng: location.lng()
    };
    
    // Update location display
    document.getElementById('selected-location').innerHTML = 
        `📍 Selected: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
    
    // Add drag listener
    marker.addListener('dragend', (event) => {
        selectedLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
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
    
    // Check if location is selected
    if (!selectedLocation) {
        showAlert('Please select a location on the map', 'danger');
        return;
    }
    
    // Get form data
    const formData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        timestamp: new Date().toISOString()
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
        const response = await fetch('https://safe-city-8gxz.onrender.com/api/incidents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showPopup('Report submitted successfully!');
            showAlert('Incident reported successfully! Thank you for helping keep the community safe.', 'success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Reset form
            document.getElementById('report-form').reset();
            if (marker) {
                marker.setMap(null);
            }
            selectedLocation = null;
            document.getElementById('selected-location').innerHTML = '';
        } else {
            throw new Error('Failed to submit report');
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
