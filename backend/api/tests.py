from django.test import TestCase, Client
from django.urls import reverse
import json
from api.hos_engine import HOSEngine

class HOSEngineTests(TestCase):
    def setUp(self):
        self.engine = HOSEngine(current_cycle_used=10.0)
        self.current_loc = {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298}
        self.pickup_loc = {"name": "Indianapolis, IN", "lat": 39.7684, "lng": -86.1581}
        self.dropoff_loc = {"name": "Dallas, TX", "lat": 32.7767, "lng": -96.7970}
        
        self.route_to_pickup = {"distance_miles": 180.0, "duration_seconds": 11700, "coordinates": [[41.8781, -87.6298], [39.7684, -86.1581]]}
        self.route_to_dropoff = {"distance_miles": 920.0, "duration_seconds": 60000, "coordinates": [[39.7684, -86.1581], [32.7767, -96.7970]]}

    def test_plan_trip_calculation(self):
        plan = self.engine.plan_trip(
            current_loc=self.current_loc,
            pickup_loc=self.pickup_loc,
            dropoff_loc=self.dropoff_loc,
            route_to_pickup=self.route_to_pickup,
            route_to_dropoff=self.route_to_dropoff
        )
        self.assertIn("summary", plan)
        self.assertIn("daily_logs", plan)
        self.assertGreater(len(plan["daily_logs"]), 0)
        
        # Verify each daily log sums up to 24.0 hours
        for daily_log in plan["daily_logs"]:
            totals = daily_log["totals"]
            day_sum = totals["off_duty"] + totals["sleeper_berth"] + totals["driving"] + totals["on_duty"]
            self.assertAlmostEqual(day_sum, 24.0, places=1)

    def test_34_hour_restart_trigger(self):
        # Initial cycle set to 70 hours exhausted
        exhausted_engine = HOSEngine(current_cycle_used=70.0)
        plan = exhausted_engine.plan_trip(
            current_loc=self.current_loc,
            pickup_loc=self.pickup_loc,
            dropoff_loc=self.dropoff_loc,
            route_to_pickup=self.route_to_pickup,
            route_to_dropoff=self.route_to_dropoff
        )
        # Check that restart waypoint is generated
        restart_waypoints = [w for w in plan["waypoints"] if w["type"] == "RESTART"]
        self.assertGreater(len(restart_waypoints), 0)

class APIViewTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_health_check(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertIn("status", response.json())

    def test_plan_trip_api(self):
        payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "Indianapolis, IN",
            "dropoff_location": "Dallas, TX",
            "current_cycle_used": 15.0
        }
        response = self.client.post('/api/plan-trip/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("daily_logs", data)
        self.assertIn("waypoints", data)

    def test_root_redirects_to_docs(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/api/docs/')

    def test_openapi_schema_contains_endpoints(self):
        response = self.client.get('/api/schema/')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        self.assertIn('/api/health/', content)
        self.assertIn('/api/plan-trip/', content)
