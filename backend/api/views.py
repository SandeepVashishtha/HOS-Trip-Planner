import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiExample

from .serializers import (
    HealthCheckResponseSerializer,
    PlanTripRequestSerializer,
    PlanTripResponseSerializer,
    ErrorResponseSerializer
)
from .routing_service import geocode_location, fetch_route
from .hos_engine import HOSEngine

logger = logging.getLogger(__name__)

@extend_schema(
    summary="API Health Check",
    description="Returns the operational status of the HOS Trip Planner backend service.",
    responses={
        200: HealthCheckResponseSerializer
    }
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "FMCSA HOS Trip Planner API"})


@extend_schema(
    summary="Plan Trip with FMCSA HOS Compliance",
    description=(
        "Calculates an optimized truck route, mandatory FMCSA Hours of Service rest periods "
        "(30-min break, 10-hour sleeper/off-duty, 34-hour restart), fuel stops every 1,000 miles, "
        "and generates FMCSA daily log sheet data grids for each day of the journey."
    ),
    request=PlanTripRequestSerializer,
    responses={
        200: PlanTripResponseSerializer,
        400: ErrorResponseSerializer
    },
    examples=[
        OpenApiExample(
            name="Sample Trip Planning Request",
            summary="Standard Long-Haul Route",
            description="Example payload planning a trip from Chicago, IL to Dallas, TX with pickup in Indianapolis, IN.",
            value={
                "current_location": "Chicago, IL",
                "pickup_location": "Indianapolis, IN",
                "dropoff_location": "Dallas, TX",
                "current_cycle_used": 15.5,
                "start_time": "08:00",
                "carrier_name": "Apex Freight Logistics",
                "truck_number": "TRK-709 / TRL-402",
                "driver_name": "John Doe"
            }
        )
    ]
)
@api_view(["POST"])
@permission_classes([AllowAny])
def plan_trip(request):
    """
    POST /api/plan-trip/
    """
    serializer = PlanTripRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": "Invalid input: " + str(serializer.errors)}, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    current_loc_str = validated_data.get("current_location", "").strip()
    pickup_loc_str = validated_data.get("pickup_location", "").strip()
    dropoff_loc_str = validated_data.get("dropoff_location", "").strip()
    current_cycle_used = float(validated_data.get("current_cycle_used", 0.0))
    start_time_str = validated_data.get("start_time", "08:00").strip() or "08:00"
    carrier_name = validated_data.get("carrier_name", "Apex Freight Logistics").strip() or "Apex Freight Logistics"
    truck_number = validated_data.get("truck_number", "TRK-709 / TRL-402").strip() or "TRK-709 / TRL-402"
    driver_name = validated_data.get("driver_name", "John Doe").strip() or "John Doe"

    if not current_loc_str or not pickup_loc_str or not dropoff_loc_str:
        return Response({
            "error": "Missing required fields: current_location, pickup_location, dropoff_location are required."
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
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

        return Response(response_payload)
    except Exception as e:
        logger.exception("Error processing trip planning request")
        return Response({"error": f"Internal error calculating trip plan: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
