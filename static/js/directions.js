export function directionFunction(map, routeLayer, accessKey) {
    const directionsBtn = document.querySelector('.directions-btn');
    const directionsSidebar = document.getElementById('directionsSidebar');
    const startLocationInput = document.getElementById('startLocation');
    const endLocationInput = document.getElementById('endLocation');
    const calculateRouteBtn = document.getElementById('calculateRoute');
    const transportModeSelect = document.getElementById('transportMode');
    const directionsResultsDiv = document.getElementById('directionsResults');
    
    let startLocation = null;
    let endLocation = null;
    let currentRoute = null;
    
    // Initialize the directions functionality
    function init() {
        // Toggle directions panel when directions button is clicked
        if (directionsBtn) {
            directionsBtn.addEventListener('click', toggleDirectionsPanel);
        }
        
        // Set up route calculation event listener
        if (calculateRouteBtn) {
            calculateRouteBtn.addEventListener('click', calculateRoute);
        }
        
        // Initially hide the directions results container
        if (directionsResultsDiv) {
            directionsResultsDiv.style.display = 'none';
        }
        
        // Listen for location selection changes
        if (startLocationInput) {
            startLocationInput.addEventListener('change', function() {
                startLocation = this.value;
            });
        }
        
        if (endLocationInput) {
            endLocationInput.addEventListener('change', function() {
                endLocation = this.value;
            });
        }
        
        // Populate location dropdowns
	console.log("populated");
        populateLocationDropdowns();
    }
    
    // Toggle the directions panel visibility
    function toggleDirectionsPanel() {
        if (directionsSidebar.classList.contains('active')) {
            directionsSidebar.classList.remove('active');
            // Show locations sidebar when directions sidebar is closed
            document.getElementById('locationsSidebar').style.display = 'block';
        } else {
            directionsSidebar.classList.add('active');
            // Hide locations sidebar if it's open
            document.getElementById('locationsSidebar').style.display = 'none';
            // Hide filter sidebar if it's open
            const filtersSidebar = document.getElementById('filtersSidebar');
            filtersSidebar.classList.remove('active');
            
            // Clear all markers when switching to directions view
            routeLayer.clearLayers();
            
            // Clear markers from filters view
            if (window.markersLayer) {
                window.markersLayer.clearLayers();
            }
            
            // Clear current marker from locations view
            if (window.currentMarker) {
                window.leafletMap.removeLayer(window.currentMarker);
                window.currentMarker = null;
            }
        }
    }
    
    // Fetch locations data from API
    function fetchLocations(callback) {
        // Prepare data for API call to get all locations
        const filterData = {
            key: accessKey,
            filters: ["academic", "campus_safety", "chem_lab", "computer_lab", "dining", "dorm", "has_bathroom", "parking"]
        };
        
        // API call to get all locations
        return fetch('/allLocations', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: accessKey})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Sort locations alphabetically
            data.sort((a, b) => a[0].localeCompare(b[0]));
            return data;
        })
        .catch(error => {
            console.error('Error fetching locations:', error);
            return [];
        });
    }
    
    // Populate location dropdowns with locations from database
    function populateLocationDropdowns() {
        fetchLocations().then(data => {
            // Clear existing options
            startLocationInput.innerHTML = '<option value="">Select start location</option>';
            endLocationInput.innerHTML = '<option value="">Select destination</option>';
            
            // Add locations to dropdowns
            data.forEach(location => {
                const name = location[0];
                
                const startOption = document.createElement('option');
                startOption.value = name;
                startOption.textContent = name;
                startLocationInput.appendChild(startOption);
                
                const endOption = document.createElement('option');
                endOption.value = name;
                endOption.textContent = name;
                endLocationInput.appendChild(endOption);
            });
        });
    }
    
    // Calculate route between selected locations
    function calculateRoute() {
        // Clear previous route
        routeLayer.clearLayers();
        
        // Get selected transport mode
        const profile = transportModeSelect.value;
        
        // Prepare data for route calculation
        const routeData = {
            key: accessKey,
            locations: [startLocation, endLocation],
            profile: profile
        };
        
        // API call to calculate route
        fetch('/returnRoute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(routeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                showDirectionsError(data.error);
                return;
            }
            // Process and display the route
            displayRoute(data);
        })
        .catch(error => {
            console.error('Error calculating route:', error);
            showDirectionsError('Failed to calculate route. Please try again.');
        });
    }
    
    // Display the calculated route on the map
    function displayRoute(routeData) {
        // Clear previous route
        routeLayer.clearLayers();
        
        // Check if route data is valid
        if (!routeData.routes || routeData.routes.length === 0) {
            showDirectionsError('No route found between these locations.');
            return;
        }
        
        // Get the first route
        const route = routeData.routes[0];
        currentRoute = route;
        
        // Decode the geometry
        const decodedPath = decodePolyline(route.geometry);
        
        // Create a polyline and add it to the map
        const routePath = L.polyline(decodedPath, {
            color: '#6a0dad',
            weight: 5,
            opacity: 0.7
        }).addTo(routeLayer);
        
        let startCoords, endCoords;
        
        // Use the reusable fetchLocations function to get location data
        fetchLocations().then(data => {
            // Find the coordinates for the selected start and end locations
            const startLocationData = data.find(location => location[0] === startLocation);
            const endLocationData = data.find(location => location[0] === endLocation);
            
            if (startLocationData && startLocationData[1] && endLocationData && endLocationData[1]) {
                // Parse the coordinates (stored as 'long,lat' in the database)
                const startCoordParts = startLocationData[1].split(',');
                const endCoordParts = endLocationData[1].split(',');
                
                if (startCoordParts.length === 2 && endCoordParts.length === 2) {
                    // Create position arrays for Leaflet [lat, lng]
                    startCoords = [parseFloat(startCoordParts[1]), parseFloat(startCoordParts[0])];
                    endCoords = [parseFloat(endCoordParts[1]), parseFloat(endCoordParts[0])];
                    
                    // Create green pin for start location
                    const startMarker = L.marker(startCoords, {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).addTo(routeLayer);
                    startMarker.bindPopup(`<b>Start:</b> ${startLocation}`);
                    
                    // Create red pin for end location
                    const endMarker = L.marker(endCoords, {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).addTo(routeLayer);
                    endMarker.bindPopup(`<b>Destination:</b> ${endLocation}`);
                }
            }
            // Fit the map to the route bounds and display route info
            map.fitBounds(routePath.getBounds());
            displayRouteInfo(route);
        }).catch(error => {
            console.error('Error fetching location coordinates:', error);
        });
    }
    
    // Display route information in the directions panel
    function displayRouteInfo(route) {
        // Format estimated distance and time
        const distance = (route.distance * 0.000621371).toFixed(2); 
        const durationMinutes = Math.floor(route.duration / 60);
        
        // Make sure the directions results container is visible
        directionsResultsDiv.style.display = 'block';
        
        // Create HTML for route summary
        let html = `
            <div class="route-summary">
                <div class="route-info">
                    <div class="route-distance">
                        <i class="fas fa-road"></i> ${distance} mi
                    </div>
                    <div class="route-duration">
                        <i class="fas fa-clock"></i> ${durationMinutes} min
                    </div>
                </div>
                <div class="route-instructions">
                    <h4>Directions:</h4>
                    <div class="turn-by-turn-directions">
        `;
        
        // Add turn-by-turn instructions if available
        let hasInstructions = false;
        
        // Check if route has legs and steps and add turn-by-turn instructions
        if (route.legs && route.legs.length > 0) {
            route.legs.forEach(leg => {
                if (leg.steps && leg.steps.length > 0) {
                    leg.steps.forEach((step, stepIndex) => {
                        let instruction = '';
                        let distanceText = '';
                        let iconUrl = '';
                        
                        // Format distance for this step
                        if (step.distance) {
                            const stepDistance = step.distance;
                            // Display distance in meters
                            distanceText = `<span class="step-distance">${Math.round(stepDistance)} m</span>`;
                        }
                        
                        // Determine which Mapbox direction icon to use based on maneuver type and modifier
                        if (step.maneuver && step.maneuver.type) {
                            const type = step.maneuver.type;
                            const modifier = step.maneuver.modifier || '';
                            
                            switch(type) {
                                case 'depart':
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_depart.png?raw=true';
                                    break;
                                case 'arrive':
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_arrive.png?raw=true';
                                    break;
                                case 'turn':
                                    if (modifier === 'left') {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn_left.png?raw=true';
                                    } else if (modifier === 'right') {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn_right.png?raw=true';
                                    } else if (modifier === 'slight left') {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn_slight_left.png?raw=true';
                                    } else if (modifier === 'slight right') {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn_slight_right.png?raw=true';
                                    } else if (modifier === 'sharp left') {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn_sharp_left.png?raw=true';
                                    } else if (modifier === 'sharp right') {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn_sharp_right.png?raw=true';
                                    } else {
                                        iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_turn.png?raw=true';
                                    }
                                    break;
                                case 'continue':
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_continue.png?raw=true';
                                    break;
                                case 'merge':
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_merge.png?raw=true';
                                    break;
                                case 'roundabout':
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_roundabout.png?raw=true';
                                    break;
                                case 'uturn':
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_uturn.png?raw=true';
                                    break;
                                default:
                                    iconUrl = 'https://github.com/mapbox/directions-icons/blob/master/src/png/dark/direction_continue.png?raw=true';
                            }
                        }
                        
                        // Create the icon HTML if we have an icon URL
                        const iconHtml = iconUrl ? `<img src="${iconUrl}" class="direction-icon" alt="Direction" width="24" height="24">` : '';
                        
                        if (step.maneuver && step.maneuver.instruction) {
                            instruction = step.maneuver.instruction;
                        } else if (step.instruction) {
                            instruction = step.instruction;
                        } else if (step.maneuver && step.maneuver.type) {
                            // Generate instruction based on maneuver type and modifier
                            switch(step.maneuver.type) {
                                case 'depart':
                                    instruction = `Start at ${startLocation}.`;
                                    break;
                                case 'arrive':
                                    instruction = `Arrive at ${endLocation}.`;
                                    break;
                                case 'turn':
                                    if (step.maneuver.modifier) {
                                        instruction = `Turn ${step.maneuver.modifier}`;
                                    } else {
                                        instruction = 'Turn';
                                    }
                                    if (step.name && step.name.length > 0) {
                                        instruction += ` onto ${step.name}`;
                                    }
                                    instruction += '.';
                                    break;
                                case 'continue':
                                    instruction = `Continue straight`;
                                    if (step.name && step.name.length > 0) {
                                        instruction += ` on ${step.name}`;
                                    }
                                    instruction += '.';
                                    break;
                                case 'merge':
                                    instruction = `Merge ${step.maneuver.modifier || 'onto'}`;
                                    if (step.name && step.name.length > 0) {
                                        instruction += ` ${step.name}`;
                                    }
                                    instruction += '.';
                                    break;
                                default:
                                    instruction = step.maneuver.type.charAt(0).toUpperCase() + step.maneuver.type.slice(1);
                                    if (step.maneuver.modifier && step.maneuver.type !== 'depart' && step.maneuver.type !== 'arrive') {
                                        instruction += ` ${step.maneuver.modifier}`;
                                    }
                                    if (step.name && step.name.length > 0) {
                                        instruction += ` on ${step.name}`;
                                    }
                                    instruction += '.';
                            }
                        } else if (step.name) {
                            instruction = `Continue on ${step.name}.`;
                        } else {
                            instruction = `Continue straight.`;
                        }
                        
                        // Combine icon, instruction, and distance into a single line
                        html += `<p class="direction-step">${iconHtml} ${instruction} ${distanceText}</p>`;
                        hasInstructions = true;
                    });
                }
            });
        }
        // Update the directions results div
        directionsResultsDiv.innerHTML = html;
    }

    // Show error message in the directions panel
    function showDirectionsError(message) {
        console.log(message);
        directionsResultsDiv.style.display = 'block';
        directionsResultsDiv.innerHTML = `<p>${message}</p>`;
    }
    
    // Polyline decoder function for OSRM encoded geometries
    // Source: https://github.com/mapbox/polyline/blob/master/src/polyline.js
    function decodePolyline(encoded) {
        let points = [];
        let index = 0, lat = 0, lng = 0;
        
        while (index < encoded.length) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
            
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
            
            points.push([lat / 1e5, lng / 1e5]);
        }
        
        return points;
    }
    
    // Initialize the module
    init();

    return {
        calculateRoute,
        toggleDirectionsPanel
    };
}
