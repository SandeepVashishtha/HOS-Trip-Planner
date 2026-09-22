from rest_framework import serializers

class HealthCheckResponseSerializer(serializers.Serializer):
    status = serializers.CharField(default="ok")
    service = serializers.CharField(default="FMCSA HOS Trip Planner API")

class PlanTripRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(
        required=True,
        help_text="Starting location of the truck (e.g., 'Chicago, IL' or '41.8781, -87.6298')"
    )
    pickup_location = serializers.CharField(
        required=True,
        help_text="Pickup location / shipper address (e.g., 'Indianapolis, IN')"
    )
    dropoff_location = serializers.CharField(
        required=True,
        help_text="Delivery location / consignee address (e.g., 'Dallas, TX')"
    )
    current_cycle_used = serializers.FloatField(
        required=False,
        default=0.0,
        help_text="Hours already accumulated in the current 70-hour / 8-day cycle (0 to 70)"
    )
    start_time = serializers.CharField(
        required=False,
        default="08:00",
        help_text="Trip start time in 24-hour HH:MM format (default '08:00')"
    )
    carrier_name = serializers.CharField(
        required=False,
        default="Apex Freight Logistics",
        help_text="Carrier / Fleet Company Name"
    )
    truck_number = serializers.CharField(
        required=False,
        default="TRK-709 / TRL-402",
        help_text="Tractor and Trailer identification numbers"
    )
    driver_name = serializers.CharField(
        required=False,
        default="John Doe",
        help_text="Driver Full Name"
    )

class LocationSerializer(serializers.Serializer):
    name = serializers.CharField()
    lat = serializers.FloatField()
    lng = serializers.FloatField()

class RouteLegSerializer(serializers.Serializer):
    distance_miles = serializers.FloatField()
    duration_seconds = serializers.FloatField()

class RoutesSerializer(serializers.Serializer):
    to_pickup = RouteLegSerializer()
    to_dropoff = RouteLegSerializer()
    full_path_coordinates = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField())
    )

class TripSummarySerializer(serializers.Serializer):
    total_distance_miles = serializers.FloatField()
    total_driving_hours = serializers.FloatField()
    total_trip_duration_hours = serializers.FloatField()
    total_fuel_stops = serializers.IntegerField()
    total_rest_stops = serializers.IntegerField()
    total_overnight_stops = serializers.IntegerField()
    cycle_hours_remaining = serializers.FloatField()
    start_time = serializers.CharField()
    est_arrival_time = serializers.CharField()

class WaypointSerializer(serializers.Serializer):
    type = serializers.CharField()
    location_name = serializers.CharField()
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    eta = serializers.CharField()
    duration_hours = serializers.FloatField()
    notes = serializers.CharField()
    distance_from_prev_miles = serializers.FloatField()

class DailyLogSerializer(serializers.Serializer):
    day_number = serializers.IntegerField()
    date = serializers.CharField()
    carrier_name = serializers.CharField()
    driver_name = serializers.CharField()
    truck_number = serializers.CharField()
    totals = serializers.DictField()
    grid_events = serializers.ListField()

class PlanTripResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    input = serializers.DictField()
    locations = serializers.DictField()
    routes = RoutesSerializer()
    summary = TripSummarySerializer()
    waypoints = serializers.ListField(child=serializers.DictField())
    daily_logs = serializers.ListField(child=serializers.DictField())
    events_timeline = serializers.ListField(child=serializers.DictField())

class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField()
