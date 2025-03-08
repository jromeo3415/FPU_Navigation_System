const accessKey = 1234; // change this in production. value should not be hard coded in as users can use devtools to determine key
var start = [28.14944, -81.85139];
var end = [28.1491, -81.8472];
var polyLines = [];

function openNav() {
    document.getElementById("nav-menu").style.width = "250px";
    document.getElementById("nav-menu").style.display = "block";
}

function closeNav() {
    document.getElementById("nav-menu").style.width = "0";
    document.getElementById("nav-menu").style.display = "none";
}

async function getCoords(location) {    // takes name of location as input and returns location's coordinates
    try {
        const response = await fetch('http://localhost:5000/getLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Key': `${accessKey}`
            },
            body: JSON.stringify({data: `${location}`})
        });

        const data = await response.json();
        console.log("first data: " + data);
        //console.log(Object.keys(response));
        console.log("data: ", data);
        return data.split(", ");

    } catch (error) {
        console.log("error happened");
        console.error("Error: ", error);
        return null;
    }
}

function setStart(location) { // sets starting waypoint for routing
    getCoords(location).then(coordinates=> {
        console.log("location: " + coordinates);
        start = [coordinates[0], coordinates[1]];
        console.log("start: " + start);
    }).catch(error => console.error(error));
}

function setDest(location) {    //  sets destination waypoint for routing
    getCoords(location).then(coordinates => {
        end = [coordinates[0], coordinates[1]];
    }).catch(error => console.error(error));
}

function routePath(){
    let route = L.Routing.control({
        waypoints: [start, end],
        router: L.Routing.osrmv1({
            serviceUrl: 'http://100.83.147.89:5000/route/v1',
            profile: 'foot'
        })
    }).addTo(map);
    polyLines.push(route);
    console.log("start and end:");
    console.log(start);
    console.log(end);
}

var map = L.map('map', {
    center: [28.1483, -81.8489],
    zoom: 16,
    zoomControl: false
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

/*var line = L.Routing.control({
    waypoints: [start, end],
    router: L.Routing.osrmv1({
        serviceUrl: 'http://100.83.147.89:5000/route/v1',
        profile: 'foot'
    })
}).addTo(map);*/

function deleteLine(){
    if(polyLines.length > 0){
        let lineToDelete = polyLines.pop();
        lineToDelete.remove();
    }
    else {
        console.log("Error: trying to delete poly lines when none are present")
    }
}