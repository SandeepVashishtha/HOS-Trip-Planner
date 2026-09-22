import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .routing_service import geocode_location, fetch_route
from .hos_engine import HOSEngine

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    return JsonResponse({"status": "ok", "service": "FMCSA HOS Trip Planner API"})

@csrf_exempt
@require_http_methods(["POST"])
def plan_trip(request):
    """
    POST /api/plan-trip/
    Body JSON:
    {
        "current_location": "Chicago, IL",
        "pickup_location": "Indianapolis, IN",
        "dropoff_location": "Dallas, TX",
        "current_cycle_used": 15.5
    }
    """
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception as e:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    current_loc_str = data.get("current_location", "").strip()
    pickup_loc_str = data.get("pickup_location", "").strip()
    dropoff_loc_str = data.get("dropoff_location", "").strip()
    current_cycle_used = float(data.get("current_cycle_used", 0.0))
    start_time_str = data.get("start_time", "08:00").strip() or "08:00"
    carrier_name = data.get("carrier_name", "Apex Freight Logistics").strip() or "Apex Freight Logistics"
    truck_number = data.get("truck_number", "TRK-709 / TRL-402").strip() or "TRK-709 / TRL-402"
    driver_name = data.get("driver_name", "John Doe").strip() or "John Doe"

    if not current_loc_str or not pickup_loc_str or not dropoff_loc_str:
        return JsonResponse({
            "error": "Missing required fields: current_location, pickup_location, dropoff_location are required."
        }, status=400)

    # 1. Geocode locations
    current_loc = geocode_location(current_loc_str)
    pickup_loc = geocode_location(pickup_loc_str)
    dropoff_loc = geocode_location(dropoff_loc_str)

    # 2. Fetch routes (Current -> Pickup) and (Pickup -> Dropoff)
    route_to_pickup = fetch_route(current_loc, pickup_loc)
    route_to_dropoff = fetch_route(pickup_loc, dropoff_loc)

    # Combine route coordinates for map display
    combined_route_coords = route_to_pickup["coordinates"] + route_to_dropoff["coordinates"]

    # 3. Run FMCSA HOS Engine
    engine = HOSEngine(current_cycle_used=current_cycle_used)
    trip_plan = engine.plan_trip(
        current_loc=current_loc,
        pickup_loc=pickup_loc,
        dropoff_loc=dropoff_loc,
        route_to_pickup=route_to_pickup,
        route_to_dropoff=route_to_dropoff,
        start_time_str=start_time_str,
        carrier_name=carrier_name,
        truck_number=truck_number,
        driver_name=driver_name
    )

    response_payload = {
        "success": True,
        "input": {
            "current_location": current_loc["name"],
            "pickup_location": pickup_loc["name"],
            "dropoff_location": dropoff_loc["name"],
            "current_cycle_used": current_cycle_used
        },
        "locations": {
            "current": current_loc,
            "pickup": pickup_loc,
            "dropoff": dropoff_loc
        },
        "routes": {
            "to_pickup": {
                "distance_miles": route_to_pickup["distance_miles"],
                "duration_seconds": route_to_pickup["duration_seconds"]
            },
            "to_dropoff": {
                "distance_miles": route_to_dropoff["distance_miles"],
                "duration_seconds": route_to_dropoff["duration_seconds"]
            },
            "full_path_coordinates": combined_route_coords
        },
        "summary": trip_plan["summary"],
        "waypoints": trip_plan["waypoints"],
        "daily_logs": trip_plan["daily_logs"],
        "events_timeline": trip_plan["events_timeline"]
    }

    return JsonResponse(response_payload)
