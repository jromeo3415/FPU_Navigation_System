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
        }
    }
    
    // Populate location dropdowns with available locations
    function populateLocationDropdowns() {
        // Prepare data for API call to get all locations
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
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Sort locations alphabetically
            data.sort((a, b) => a[0].localeCompare(b[0]));
            
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
        })
        .catch(error => {
            console.error('Error fetching locations for directions:', error);
        });
    }
    
    // Calculate route between selected locations
    function calculateRoute() {
        // Clear previous route
        routeLayer.clearLayers();
        
        // Validate inputs
        if (!startLocation || !endLocation) {
            showDirectionsError('Please select both start and end locations');
            return;
        }
        
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
            showDirectionsError('No route found between these locations');
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
        
        // Get start and end coordinates from the decoded path
        const startCoords = decodedPath[0];
        const endCoords = decodedPath[decodedPath.length - 1];
        
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
        
        // Fit the map to the route bounds and display route info
        map.fitBounds(routePath.getBounds());
        displayRouteInfo(route);
    }
    
    // Display route information in the directions panel
    function displayRouteInfo(route) {
        // Convert distance to miles
        const distance = (route.distance * 0.000621371).toFixed(2); 
        
        // Format duration
        const durationMinutes = Math.floor(route.duration / 60);
        const durationSeconds = Math.floor(route.duration % 60);
        
        // Create HTML for route summary
        let html = `
            <div class="route-summary">
                <div class="route-info">
                    <div class="route-distance">
                        <i class="fas fa-road"></i> ${distance} mi
                    </div>
                    <div class="route-duration">
                        <i class="fas fa-clock"></i> ${durationMinutes}m ${durationSeconds}s
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
                        let distance = '';
                        
                        // Format distance for this step if available
                        if (step.distance) {
                            const stepDistance = step.distance;
                            if (stepDistance >= 1000) {
                                distance = ` for ${(stepDistance * 0.000621371).toFixed(1)} miles`;
                            } else if (stepDistance > 100) {
                                distance = ` for ${Math.round(stepDistance * 3.28084)} feet`;
                            }
                        }
                        
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
                                    instruction = `Arrive at ${endLocation} (destination${step.maneuver.modifier === 'right' ? ' will be on the right' : step.maneuver.modifier === 'left' ? ' will be on the left' : ''}).`;
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
                                    instruction = `Continue straight${distance}`;
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
                            instruction = `Continue on ${step.name}${distance}.`;
                        } else {
                            instruction = `Continue straight${distance}.`;
                        }
                        
                        html += `<p>${instruction}</p>`;
                        hasInstructions = true;
                    });
                }
            });
        }
        // Update the directions results div
        directionsResultsDiv.innerHTML = html;
    }
    
    // Polyline decoder function for OSRM encoded geometries
    // Source: Google Maps JavaScript API v3 documentation
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