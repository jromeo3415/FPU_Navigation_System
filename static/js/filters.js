export function filterFunction(map, markersLayer, accessKey) {
    // Get filter sidebar and button
    const filtersSidebar = document.getElementById('filtersSidebar');
    const filterBtn = document.getElementById('filterBtn');
    
    // Add event listener to filter button
    filterBtn.addEventListener('click', function() {
        // Toggle filter sidebar
        if (filtersSidebar.classList.contains('active')) {
            filtersSidebar.classList.remove('active');
            // Show locations sidebar when filter sidebar is closed
            document.getElementById('locationsSidebar').style.display = 'block';
        } else {
            filtersSidebar.classList.add('active');
            // Hide locations sidebar when filter sidebar is opened
            document.getElementById('locationsSidebar').style.display = 'none';
            // Hide directions sidebar if it's open
            const directionsSidebar = document.getElementById('directionsSidebar');
            directionsSidebar.classList.remove('active');
        }
    });

    // Add event listener to apply filters button
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    applyFiltersBtn.addEventListener('click', function() {
        applySelectedFilters();
    });

    // Function to collect all selected filters and apply them
    function applySelectedFilters() {
        // Get all checked checkboxes and extract their category values
        const checkedFilters = document.querySelectorAll('.filter-categories input[type="checkbox"]:checked');
        const selectedCategories = Array.from(checkedFilters).map(checkbox => checkbox.getAttribute('data-category'));
        
        applyFilter(selectedCategories);
    }

    // Function to apply filter and get locations from backend
    function applyFilter(categories) {
        // Prepare data for API call
        const filterData = {
            key: accessKey,
            filters: categories
        };
        
        // API call to get filtered locations
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
            // Process and display filtered locations on map
            displayFilteredLocations(data);
        })
        .catch(error => {
            console.error('Error fetching filtered locations:', error);
            alert('Failed to fetch filtered locations. Please try again.');
        });
    }

    // Function to display filtered locations on the map
    function displayFilteredLocations(locations) {
        // Clear existing markers
        markersLayer.clearLayers();

        // Check if we have locations
        if (locations && Array.isArray(locations) && locations.length > 0) {
            // Track how many locations we're processing
            let locationCount = 0;
            
            // Process each location
            locations.forEach(location => {
                // Extract location name and coordinates from the response
                const name = location[0];
                const coords = location[1];
                locationCount++;
                
                if (coords) {
                    try {
                        // Parse the coordinates from the database
                        // Coordinates are stored as 'long,lat' in the database
                        const coordParts = coords.split(',');
                        if (coordParts.length === 2) {
                            const lng = parseFloat(coordParts[0]);
                            const lat = parseFloat(coordParts[1]);
                            
                            // Create position array for Leaflet [lat, lng]
                            const position = [lat, lng];
                            
                            // Create marker with default pin icon
                            const marker = L.marker(position, {
                                icon: L.icon({
                                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34],
                                    shadowSize: [41, 41]
                                })
                            }).addTo(markersLayer);
                            
                            // Create popup content with the location name
                            let popupContent = `<div class="location-popup"><h3>${name}</h3></div>`;
                            marker.bindPopup(popupContent);
                        }
                    } catch (error) {
                        console.error(`Error parsing coordinates for ${name}: ${coords}`, error);
                    }
                } else {
                    console.error(`No coordinates available for ${name}`);
                }
            });
        } else {
            // No locations found
            console.log('No locations found or invalid response format:', locations);
            alert('No locations match the selected filters.');
        }
    }
    return {
        applySelectedFilters
    };
}