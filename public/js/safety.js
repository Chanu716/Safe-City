// Safety.js - Safety Analysis and Real-time Alerts

let map;
let infoWindow;
let userMarker;
let currentLocation = null;
let incidentMarkers = [];
let safetyCircles = [];
let alertInterval;

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

    infoWindow = new google.maps.InfoWindow();

    // Add click listener to map
    map.addListener('click', (event) => {
        analyzeLocation(event.latLng);
    });

    // Get user's current location and start alerts
    getCurrentLocation();
    startRealTimeAlerts();
}
window.initMap = initMap;

// Get user's current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setCenter(currentLocation);
                
                // Add user marker
                if (userMarker) {
                    userMarker.map = null;
                }
                
                // Create user marker with AdvancedMarkerElement if available
                if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                    // Create a custom pin element for user location
                    const pinElement = document.createElement('div');
                    pinElement.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="8" fill="#4285F4"/>
                            <circle cx="12" cy="12" r="3" fill="white"/>
                        </svg>
                    `;
                    
                    userMarker = new google.maps.marker.AdvancedMarkerElement({
                        position: currentLocation,
                        map: map,
                        title: 'Your Location',
                        content: pinElement
                    });
                } else {
                    // Fallback to legacy Marker
                    userMarker = new google.maps.Marker({
                        position: currentLocation,
                        map: map,
                        title: 'Your Location',
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="8" fill="#4285F4"/>
                                    <circle cx="12" cy="12" r="3" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(24, 24)
                        }
                    });
                }
                
                document.getElementById('location-status').innerHTML = 
                    '<div class="alert alert-success">📍 Location tracking active</div>';
                    
                // Load nearby incidents
                loadNearbyIncidents();
            },
            (error) => {
                console.error('Error getting location:', error);
                document.getElementById('location-status').innerHTML = 
                    '<div class="alert alert-warning">⚠️ Location access denied. Click on map to analyze areas.</div>';
            }
        );
    }
}

// Analyze clicked location for safety
async function analyzeLocation(latLng) {
    const location = {
        lat: latLng.lat(),
        lng: latLng.lng()
    };
    
    try {
        // Determine API base URL (localhost vs production)
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? `http://localhost:3000`
            : 'https://safe-city-8gxz.onrender.com';
        
        // Fetch incidents near this location
        const response = await fetch(`${apiBaseUrl}/api/incidents/nearby?lat=${location.lat}&lng=${location.lng}&radius=1000`);
        const incidents = await response.json();
        
        // Calculate safety level
        const safetyData = calculateSafetyLevel(incidents);
        
        // Show info window
        const content = createSafetyInfoWindow(safetyData, incidents, location);
        infoWindow.setContent(content);
        infoWindow.setPosition(latLng);
        infoWindow.open(map);
        
        // Add safety circle
        addSafetyCircle(location, safetyData.level);
        
    } catch (error) {
        console.error('Error analyzing location:', error);
        infoWindow.setContent('<div class="alert alert-danger">Error analyzing location</div>');
        infoWindow.setPosition(latLng);
        infoWindow.open(map);
    }
}

// Calculate safety level based on incidents
function calculateSafetyLevel(incidents) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter recent incidents
    const recentIncidents = incidents.filter(incident => 
        new Date(incident.timestamp) > oneWeekAgo
    );
    
    const count = recentIncidents.length;
    let level, color, description;
    
    if (count === 0) {
        level = 'safe';
        color = '#4CAF50';
        description = 'Safe Zone - No recent incidents reported';
    } else if (count <= 2) {
        level = 'warning';
        color = '#FFC107';
        description = 'Alert Zone - Few incidents reported recently';
    } else {
        level = 'danger';
        color = '#F44336';
        description = 'High Risk Zone - Multiple incidents reported';
    }
    
    return {
        level,
        color,
        description,
        incidentCount: count,
        recentIncidents
    };
}

// Create info window content
function createSafetyInfoWindow(safetyData, allIncidents, location) {
    const incidentsList = safetyData.recentIncidents.length > 0 
        ? safetyData.recentIncidents.map(incident => `
            <div style="margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 5px;">
                <strong>${incident.title}</strong><br>
                <small>${incident.category} - ${new Date(incident.timestamp).toLocaleDateString()}</small>
            </div>
        `).join('')
        : '<p>No recent incidents in this area.</p>';
    
    return `
        <div style="max-width: 300px;">
            <h3>Safety Analysis</h3>
            <div class="safety-level safety-${safetyData.level}">
                ${safetyData.description}
            </div>
            <p><strong>Recent Incidents (7 days):</strong> ${safetyData.incidentCount}</p>
            <p><strong>Location:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
            <div style="max-height: 150px; overflow-y: auto;">
                <h4>Recent Incidents:</h4>
                ${incidentsList}
            </div>
        </div>
    `;
}

// Add safety circle to map
function addSafetyCircle(location, level) {
    // Remove old circles if too many
    if (safetyCircles.length > 5) {
        safetyCircles[0].setMap(null);
        safetyCircles.shift();
    }
    
    const colors = {
        safe: '#4CAF50',
        warning: '#FFC107',
        danger: '#F44336'
    };
    
    const circle = new google.maps.Circle({
        strokeColor: colors[level],
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: colors[level],
        fillOpacity: 0.2,
        map: map,
        center: location,
        radius: 200 // 200 meter radius
    });
    
    safetyCircles.push(circle);
}

// Load nearby incidents and show on map
async function loadNearbyIncidents() {
    if (!currentLocation) return;
    
    try {
        const response = await fetch(
            `/api/incidents/nearby?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=2000`
        );
        const incidents = await response.json();
        
        // Clear existing markers
        incidentMarkers.forEach(marker => {
            if (marker.map) {
                marker.map = null;
            } else {
                marker.setMap(null);
            }
        });
        incidentMarkers = [];
        
        // Add incident markers
        incidents.forEach(incident => {
            let marker;
            
            if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                // Create custom pin element for incident
                const pinElement = document.createElement('div');
                pinElement.innerHTML = `<img src="${getIncidentIcon(incident.category)}" style="width: 32px; height: 32px;">`;
                
                marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: incident.latitude, lng: incident.longitude },
                    map: map,
                    title: incident.title,
                    content: pinElement
                });
            } else {
                // Fallback to legacy Marker
                marker = new google.maps.Marker({
                    position: { lat: incident.latitude, lng: incident.longitude },
                    map: map,
                    title: incident.title,
                    icon: {
                        url: getIncidentIcon(incident.category),
                        scaledSize: new google.maps.Size(32, 32)
                    }
                });
            }
            
            const infoContent = `
                <div>
                    <h4>${incident.title}</h4>
                    <p><strong>Category:</strong> ${incident.category}</p>
                    <p><strong>Description:</strong> ${incident.description}</p>
                    <p><strong>Time:</strong> ${new Date(incident.timestamp).toLocaleString()}</p>
                </div>
            `;
            
            marker.addListener('click', () => {
                infoWindow.setContent(infoContent);
                infoWindow.open(map, marker);
            });
            
            incidentMarkers.push(marker);
        });
        
    } catch (error) {
        console.error('Error loading incidents:', error);
    }
}

// Get incident icon based on category
function getIncidentIcon(category) {
    const icons = {
        'Theft': '🔴',
        'Harassment': '🟠',
        'Violence': '🔴',
        'Vandalism': '🟡',
        'Suspicious Activity': '🟡',
        'Other': '⚪'
    };
    
    const emoji = icons[category] || '⚪';
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
            <text x="16" y="24" font-size="20" text-anchor="middle">${emoji}</text>
        </svg>
    `)}`;
}

// Start real-time danger alerts
function startRealTimeAlerts() {
    if (!navigator.geolocation) return;
    
    alertInterval = setInterval(async () => {
        if (!currentLocation) return;
        
        try {
            // Check for new incidents in the last 5 minutes within 1km
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const response = await fetch(
                `/api/incidents/recent?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=1000&since=${fiveMinutesAgo}`
            );
            const recentIncidents = await response.json();
            
            if (recentIncidents.length > 0) {
                showDangerAlert(recentIncidents[0]);
            }
            
        } catch (error) {
            console.error('Error checking for alerts:', error);
        }
    }, 30000); // Check every 30 seconds
}

// Show danger alert
function showDangerAlert(incident) {
    const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        incident.latitude, incident.longitude
    );
    
    const alertHtml = `
        <div class="alert alert-danger" style="position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 300px;">
            <h4>🚨 DANGER ALERT</h4>
            <p><strong>${incident.title}</strong></p>
            <p>Category: ${incident.category}</p>
            <p>Distance: ${distance.toFixed(0)}m away</p>
            <p>Time: ${new Date(incident.timestamp).toLocaleString()}</p>
            <button onclick="this.parentElement.remove()" style="float: right; border: none; background: none; font-size: 18px;">×</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert.alert-danger');
        if (alert) alert.remove();
    }, 10000);
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// Refresh data
function refreshData() {
    loadNearbyIncidents();
    if (currentLocation) {
        getCurrentLocation();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add refresh button listener
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
});

// Toggle manual coordinate input for safety analysis
function toggleManualCoordinatesSafety() {
    const manualDiv = document.getElementById('manual-coordinates-safety');
    if (manualDiv.style.display === 'none' || manualDiv.style.display === '') {
        manualDiv.style.display = 'block';
    } else {
        manualDiv.style.display = 'none';
    }
}

// Analyze safety at searched location (geocode)
function analyzeLocationSearch() {
    const locationInput = document.getElementById('safety-location-search').value.trim();
    if (!locationInput) {
        showAlert('Please enter a location to search.', 'error');
        return;
    }
    if (window.google && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: locationInput }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const loc = results[0].geometry.location;
                if (map) {
                    map.setCenter(loc);
                }
                analyzeLocation(loc);
                showAlert('Analyzing safety at: ' + results[0].formatted_address, 'info');
                document.getElementById('manual-coordinates-safety').style.display = 'none';
            } else {
                showAlert('Location not found. Please try a different search.', 'error');
            }
        });
    } else {
        showAlert('Map/geocoding service unavailable. Please use the map or live location.', 'error');
    }
}

// Use live location for safety analysis
function useCurrentLocationSafety() {
    getCurrentLocation();
    document.getElementById('manual-coordinates-safety').style.display = 'none';
    showAlert('Using your live location for safety analysis.', 'info');
}

// Helper function to show alerts in safety page
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        padding: 0.75rem 1rem;
        margin: 1rem 0;
        border-radius: 4px;
        border: 1px solid;
        background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
        border-color: ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
    `;
    
    const container = document.querySelector('.form-container') || document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (alertInterval) {
        clearInterval(alertInterval);
    }
});
