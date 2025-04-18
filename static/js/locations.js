document.addEventListener('DOMContentLoaded', function() {
    // Access key for backend API calls
    const accessKey = "1234";
    
    // Variable to track the current marker
    let currentMarker = null;
    // Make currentMarker accessible globally
    window.currentMarker = currentMarker;
    
    // Function to load all locations
    function loadAllLocations() {
        // Prepare data for API call
        const filterData = {
            key: accessKey,
            filters: ["academic", "campus_safety", "chem_lab", "computer_lab", "dining", "dorm", "has_bathroom", "parking"]
        };
        
        // API call to get all locations
        fetch('/returnFiltered', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterData)
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Sort locations alphabetically
            data.sort((a, b) => a[0].localeCompare(b[0]));
            
            // Display locations in the sidebar
            displayLocationsList(data);
        })
        .catch(error => {
            console.error('Error fetching locations:', error);
            const locationsListElement = document.getElementById('locationsList');
            if (locationsListElement) {
                locationsListElement.innerHTML = '<div class="error-message">Error loading locations. Please try again.</div>';
            }
        });
    }
    
    // Function to display locations in the sidebar
    function displayLocationsList(locations) {
        const locationsListElement = document.getElementById('locationsList');
        if (!locationsListElement) {
            console.error('locationsList element not found');
            return;
        }
        
        locationsListElement.innerHTML = '';
        
        if (locations && Array.isArray(locations) && locations.length > 0) {
            locations.forEach(location => {
                const name = location[0];
                const coords = location[1];
                
                const locationItem = document.createElement('div');
                locationItem.className = 'location-item';
                locationItem.textContent = name;
                locationItem.setAttribute('data-coords', coords);
                
                locationItem.addEventListener('click', function() {
                    // Center map on this location and show popup
                    const coordParts = coords.split(',');
                    if (coordParts.length === 2) {
                        const lng = parseFloat(coordParts[0]);
                        const lat = parseFloat(coordParts[1]);
                        
                        // Create position array for Leaflet [lat, lng]
                        const position = [lat, lng];
                        
                        // Center map on location
                        if (window.leafletMap) {
                            window.leafletMap.setView(position, 18);
                            
                            // Remove previous marker if it exists
                            if (currentMarker) {
                                window.leafletMap.removeLayer(currentMarker);
                            }
                            
                            // Create marker with default pin icon
                            currentMarker = L.marker(position, {
                                icon: L.icon({
                                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34],
                                    shadowSize: [41, 41]
                                })
                            }).addTo(window.leafletMap);
                            currentMarker.bindPopup(`<div class="location-popup"><h3>${name}</h3></div>`).openPopup();
                            // Update global reference
                            window.currentMarker = currentMarker;
                        }
                    }
                });
                
                locationsListElement.appendChild(locationItem);
            });
        } else {
            console.error('No locations data or invalid format', locations);
            locationsListElement.innerHTML = '<div class="no-locations">No locations found</div>';
        }
    }
    
    // Search functionality for locations list
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const locationItems = document.querySelectorAll('.location-item');
            
            locationItems.forEach(item => {
                const locationName = item.textContent.toLowerCase();
                if (locationName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    // Load all locations when page loads
    try {
        console.log('Loading all locations...');
        loadAllLocations();
    } catch (error) {
        console.error('Error loading locations:', error);
    }
    
    // Add event listener for search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            loadAllLocations();
        });
    }
    
    // Make map available globally for location item click handlers
    window.addEventListener('map:initialized', function(e) {
        window.leafletMap = e.detail.map;
    });
    
    // Listen for reload:locations event from filters.js
    window.addEventListener('reload:locations', function() {
        // Reload all locations when switching back from filters view
        loadAllLocations();
        // Remove current marker if it exists
        if (window.currentMarker) {
            window.leafletMap.removeLayer(window.currentMarker);
            window.currentMarker = null;
        }
        // Clear route layer when switching to locations view
        if (window.routeLayer) {
            window.routeLayer.clearLayers();
        }
    });
});