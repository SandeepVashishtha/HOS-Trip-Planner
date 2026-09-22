import requests
import math
import logging

logger = logging.getLogger(__name__)

# Fallback geocoding dataset for major US trucking hubs & cities
CITY_COORDINATES = {
    "chicago, il": {"lat": 41.8781, "lng": -87.6298, "name": "Chicago, IL"},
    "chicago": {"lat": 41.8781, "lng": -87.6298, "name": "Chicago, IL"},
    "new york, ny": {"lat": 40.7128, "lng": -74.0060, "name": "New York, NY"},
    "new york": {"lat": 40.7128, "lng": -74.0060, "name": "New York, NY"},
    "los angeles, ca": {"lat": 34.0522, "lng": -118.2437, "name": "Los Angeles, CA"},
    "los angeles": {"lat": 34.0522, "lng": -118.2437, "name": "Los Angeles, CA"},
    "dallas, tx": {"lat": 32.7767, "lng": -96.7970, "name": "Dallas, TX"},
    "dallas": {"lat": 32.7767, "lng": -96.7970, "name": "Dallas, TX"},
    "atlanta, ga": {"lat": 33.7490, "lng": -84.3880, "name": "Atlanta, GA"},
    "atlanta": {"lat": 33.7490, "lng": -84.3880, "name": "Atlanta, GA"},
    "denver, co": {"lat": 39.7392, "lng": -104.9903, "name": "Denver, CO"},
    "denver": {"lat": 39.7392, "lng": -104.9903, "name": "Denver, CO"},
    "seattle, wa": {"lat": 47.6062, "lng": -122.3321, "name": "Seattle, WA"},
    "seattle": {"lat": 47.6062, "lng": -122.3321, "name": "Seattle, WA"},
    "miami, fl": {"lat": 25.7617, "lng": -80.1918, "name": "Miami, FL"},
    "miami": {"lat": 25.7617, "lng": -80.1918, "name": "Miami, FL"},
    "st. louis, mo": {"lat": 38.6270, "lng": -90.1994, "name": "St. Louis, MO"},
    "st louis, mo": {"lat": 38.6270, "lng": -90.1994, "name": "St. Louis, MO"},
    "st. louis": {"lat": 38.6270, "lng": -90.1994, "name": "St. Louis, MO"},
    "indianapolis, in": {"lat": 39.7684, "lng": -86.1581, "name": "Indianapolis, IN"},
    "indianapolis": {"lat": 39.7684, "lng": -86.1581, "name": "Indianapolis, IN"},
    "phoenix, az": {"lat": 33.4484, "lng": -112.0740, "name": "Phoenix, AZ"},
    "phoenix": {"lat": 33.4484, "lng": -112.0740, "name": "Phoenix, AZ"},
}

def geocode_location(query: str) -> dict:
    """
    Geocode a string location name into lat, lng coordinates.
    Uses Nominatim API with fallback to built-in dictionary.
    """
    clean_query = query.strip().lower()
    if clean_query in CITY_COORDINATES:
        return CITY_COORDINATES[clean_query]
    
    headers = {"User-Agent": "HOS-Trip-Planner-App/1.0"}
    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={requests.utils.quote(query)}&limit=1"
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200 and len(res.json()) > 0:
            data = res.json()[0]
            return {
                "lat": float(data["lat"]),
                "lng": float(data["lon"]),
                "name": data.get("display_name", query).split(",")[0] + ", " + data.get("display_name", "").split(",")[-2] if len(data.get("display_name", "").split(",")) > 2 else data.get("display_name", query)
            }
    except Exception as e:
        logger.warning(f"Nominatim geocoding failed for {query}: {e}")
    
    # Fallback default if not found
    return {"lat": 41.8781, "lng": -87.6298, "name": query.title()}

def haversine_distance_miles(lat1, lon1, lat2, lon2):
    """Calculate Haversine distance in miles between two lat/lng coordinates."""
    R = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    # Multiply by 1.2 to account for actual road driving distance factor vs straight line
    return R * c * 1.2

def fetch_route(loc1: dict, loc2: dict) -> dict:
    """
    Fetch road route distance, travel duration, and polyline coordinates between loc1 and loc2.
    Uses OSRM API with fallback to Haversine calculation.
    """
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{loc1['lng']},{loc1['lat']};{loc2['lng']},{loc2['lat']}?overview=full&geometries=geojson"
        res = requests.get(url, timeout=6)
        if res.status_code == 200:
            data = res.json()
            if data.get("routes"):
                route = data["routes"][0]
                distance_meters = route["distance"]
                duration_seconds = route["duration"]
                coordinates = [[pt[1], pt[0]] for pt in route["geometry"]["coordinates"]] # [lat, lng]
                
                distance_miles = distance_meters * 0.000621371
                return {
                    "distance_miles": round(distance_miles, 1),
                    "duration_seconds": duration_seconds,
                    "coordinates": coordinates
                }
    except Exception as e:
        logger.warning(f"OSRM route fetch failed: {e}")
    
    # Fallback to Haversine calculation
    dist = haversine_distance_miles(loc1["lat"], loc1["lng"], loc2["lat"], loc2["lng"])
    # Estimate coordinates interpolation
    steps = max(10, int(dist / 20))
    coords = []
    for i in range(steps + 1):
        t = i / steps
        lat = loc1["lat"] + (loc2["lat"] - loc1["lat"]) * t
        lng = loc1["lng"] + (loc2["lng"] - loc1["lng"]) * t
        coords.append([round(lat, 5), round(lng, 5)])
    
    # Average speed ~55 mph
    duration_hours = dist / 55.0
    return {
        "distance_miles": round(dist, 1),
        "duration_seconds": duration_hours * 3600,
        "coordinates": coords
    }
