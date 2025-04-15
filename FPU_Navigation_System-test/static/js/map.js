// Import modules for filters and directions
import { filterFunction } from './filters.js';
import { directionFunction } from './directions.js';

// Initialize the map centered on Florida Polytechnic University
document.addEventListener('DOMContentLoaded', function() {
    // Florida Polytechnic University coordinates
    const fpuCoordinates = [28.148189, -81.848820];
    const initialZoom = 16;
    const accessKey = "1234"; // Access key for backend API calls
    let map, routeLayer, markersLayer;
    
    // Initialize the map
    map = L.map('map').setView(fpuCoordinates, initialZoom);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Initialize layers for markers and routes
    markersLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    
    // Create zooming controls 
    L.Control.HomeAndZoomControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        
        onAdd: function(map) {
            // Create container for all controls
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            
            // Create home button 
            const homeButton = L.DomUtil.create('a', 'home-button', container);
            homeButton.href = '#';
            homeButton.title = 'FPU Home';
            homeButton.innerHTML = '⌂'; 
            homeButton.style.fontWeight = 'bold';
            homeButton.style.fontSize = '18px';
            
            // Create zoom in button
            const zoomInButton = L.DomUtil.create('a', 'leaflet-control-zoom-in', container);
            zoomInButton.href = '#';
            zoomInButton.title = 'Zoom in';
            zoomInButton.innerHTML = '+';
            
            // Create zoom out button
            const zoomOutButton = L.DomUtil.create('a', 'leaflet-control-zoom-out', container);
            zoomOutButton.href = '#';
            zoomOutButton.title = 'Zoom out';
            zoomOutButton.innerHTML = '−';
            
            // Add event listeners
            L.DomEvent.on(homeButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                map.setView(fpuCoordinates, initialZoom);
            });

            L.DomEvent.on(zoomInButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                map.zoomIn();
            });
            
            L.DomEvent.on(zoomOutButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                map.zoomOut();
            });
            
            // Prevent map click events when clicking the buttons
            L.DomEvent.disableClickPropagation(container);
            
            return container;
        }
    });
    
    // Add the custom control to the map
    new L.Control.HomeAndZoomControl().addTo(map);
    map.zoomControl.remove();
    
    // Make sure the map container is visible
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.height = '100%';
        mapContainer.style.width = '100%';
        // Force a resize event to ensure the map renders correctly
        setTimeout(function() {
            map.invalidateSize();
        }, 100);
    }

    // Initialize filters and directions modules
    const filtersModule = filterFunction(map, markersLayer, accessKey);
    const directionsModule = directionFunction(map, routeLayer, accessKey);
});