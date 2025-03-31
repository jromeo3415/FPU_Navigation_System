// Initialize the map centered on Florida Polytechnic University
document.addEventListener('DOMContentLoaded', function() {
    // Florida Polytechnic University coordinates
    const fpuCoordinates = [28.148189, -81.848820];
    
    // Initialize the map
    const map = L.map('map').setView(fpuCoordinates, 16);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
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
});