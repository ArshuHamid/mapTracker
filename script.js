let map;
let marker;
let totalDistance = 0;
let currentIndex = 0;
let locations = [];
let directionsService;
let directionsRenderer;
let routePath = [];

const initialLocation = { lat: 25.424211014700305, lng: 81.83365303937614 }; // Prayagraj, UP coordinates

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: initialLocation,
    });

    // Create a marker
    marker = new google.maps.Marker({
        position: initialLocation,
        map: map,
        title: "Current Location",
        icon: {
            url: "https://img.icons8.com/ios-filled/50/000000/car.png",
            scaledSize: new google.maps.Size(40, 40),
        },
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: 'blue',
            strokeWeight: 4,
        },
    });
    
    directionsRenderer.setMap(map);

    // Fetch initial vehicle location and set up an interval to move the marker every 5 seconds
    fetchVehicleLocation();
    setInterval(moveMarker, 5000);
}

// Fetch vehicle location data
function fetchVehicleLocation() {
    const timeOption = document.getElementById('timeOption').value;
    const url = `/api/vehicle-location?time=${timeOption}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 1) {
                locations = data;
                drawRoute(data); // Draw the route
                currentIndex = 0;
                moveMarker();
            }
        })
        .catch(err => console.error("Error fetching vehicle location:", err));
}

// Move marker along route
function moveMarker() {
    if (locations.length > 1 && currentIndex < locations.length - 1) {
        const nextPosition = locations[currentIndex];
        const newPosition = { lat: nextPosition.latitude, lng: nextPosition.longitude };

        marker.setPosition(newPosition);
        map.setCenter(newPosition);

        currentIndex++;
        calculateDistanceCovered(locations.slice(0, currentIndex + 1));
    }
}

// Draw the route with waypoints
function drawRoute(locations) {
    const waypoints = locations.slice(1, -1).map(location => ({
        location: new google.maps.LatLng(location.latitude, location.longitude),
        stopover: true,
    }));

    const origin = new google.maps.LatLng(locations[0].latitude, locations[0].longitude);
    const destination = new google.maps.LatLng(locations[locations.length - 1].latitude, locations[locations.length - 1].longitude);

    const request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            routePath = result.routes[0].overview_path;
        } else {
            console.error('Error fetching directions:', status);
        }
    });
}

// Calculate the distance covered
function calculateDistanceCovered(locations) {
    totalDistance = 0;

    for (let i = 1; i < locations.length; i++) {
        const previousLocation = new google.maps.LatLng(locations[i - 1].latitude, locations[i - 1].longitude);
        const currentLocation = new google.maps.LatLng(locations[i].latitude, locations[i].longitude);

        const distance = google.maps.geometry.spherical.computeDistanceBetween(previousLocation, currentLocation);
        totalDistance += distance;
    }

    const distanceInKilometers = (totalDistance / 1000).toFixed(2);
    document.getElementById('distanceCovered').innerText = `Distance covered today: ${distanceInKilometers} km`;
}

// Start a new route manually
function startRoute() {
    const destination = { lat: 25.438213, lng: 81.834923 };

    const request = {
        origin: initialLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            routePath = result.routes[0].overview_path;
            moveCarAlongRoute();
        } else {
            console.error('Error fetching directions:', status);
        }
    });
}

// Move the car along the generated route
function moveCarAlongRoute() {
    let i = 0;
    const interval = setInterval(() => {
        if (i < routePath.length) {
            const position = routePath[i];
            marker.setPosition(position);
            map.setCenter(position);
            i++;
        } else {
            clearInterval(interval);
        }
    }, 1000);
}

// Call the initMap function to display the map
google.maps.event.addDomListener(window, 'load', initMap);
