import math
from datetime import datetime, timedelta

# Duty Status Constants
OFF_DUTY = 1
SLEEPER_BERTH = 2
DRIVING = 3
ON_DUTY = 4

DUTY_NAMES = {
    OFF_DUTY: "Off Duty",
    SLEEPER_BERTH: "Sleeper Berth",
    DRIVING: "Driving",
    ON_DUTY: "On Duty (Not Driving)"
}

DUTY_CODES = {
    "OFF_DUTY": OFF_DUTY,
    "SLEEPER_BERTH": SLEEPER_BERTH,
    "DRIVING": DRIVING,
    "ON_DUTY": ON_DUTY
}

def parse_time_to_minutes(time_str: str) -> int:
    """
    Parses time strings like '08:00', '10:30', '10:00 AM', '02:15 PM' into minute of day (0..1439).
    """
    if not time_str:
        return 480  # Default 08:00 AM
    time_str = str(time_str).strip().upper()
    try:
        if "AM" in time_str or "PM" in time_str:
            fmt = "%I:%M %p" if ":" in time_str else "%I %p"
            dt = datetime.strptime(time_str, fmt)
            return dt.hour * 60 + dt.minute
        elif ":" in time_str:
            parts = time_str.split(":")
            return int(parts[0]) * 60 + int(parts[1])
        else:
            return int(time_str) * 60
    except Exception:
        return 480

class HOSEngine:
    def __init__(self, current_cycle_used: float = 0.0, avg_speed_mph: float = 55.0):
        self.current_cycle_used = float(current_cycle_used)
        self.avg_speed_mph = avg_speed_mph
        
    def plan_trip(
        self,
        current_loc: dict,
        pickup_loc: dict,
        dropoff_loc: dict,
        route_to_pickup: dict,
        route_to_dropoff: dict,
        start_time_str: str = "08:00",
        carrier_name: str = "Apex Freight Logistics",
        truck_number: str = "TRK-709 / TRL-402",
        driver_name: str = "John Doe"
    ):
        """
        Simulate full trip itinerary from current location to pickup, then to dropoff.
        Generates timeline of events, daily log sheet datasets, map stop waypoints, and summary statistics.
        """
        events = []
        waypoints = []
        
        # Track simulation state (in minutes from Start of Day 1 00:00)
        current_minute = 0  # Day 1 start at 00:00 (midnight)
        
        # Parse initial departure start time (e.g. 10:00 AM -> 600 minutes)
        start_departure_minute = parse_time_to_minutes(start_time_str)
        
        # Cycle tracking
        cycle_on_duty_hours = self.current_cycle_used
        
        # Shift tracking
        shift_driving_minutes = 0
        shift_duty_window_minutes = 0
        driving_since_last_break = 0
        
        distance_since_fuel = 0
        
        def add_event(duty_status, duration_mins, location_name, remarks, lat=None, lng=None, event_type="REGULAR"):
            nonlocal current_minute, cycle_on_duty_hours, shift_driving_minutes, shift_duty_window_minutes, driving_since_last_break
            
            end_min = current_minute + duration_mins
            events.append({
                "duty_status": duty_status,
                "duty_code": duty_status,
                "duty_name": DUTY_NAMES[duty_status],
                "start_minute": current_minute,
                "end_minute": end_min,
                "duration_minutes": duration_mins,
                "duration_hours": round(duration_mins / 60.0, 2),
                "location": location_name,
                "remarks": remarks,
                "lat": lat,
                "lng": lng,
                "event_type": event_type
            })
            
            # Update duty & shift tracking
            if duty_status in [DRIVING, ON_DUTY]:
                cycle_on_duty_hours += duration_mins / 60.0
                shift_duty_window_minutes += duration_mins
            else:
                # If off duty / sleeper berth for 10 consecutive hours (600 mins), reset shift driving & window
                if duration_mins >= 600:
                    shift_driving_minutes = 0
                    shift_duty_window_minutes = 0
                    driving_since_last_break = 0
                # If off duty for 34 consecutive hours (2040 mins), reset 70-hr cycle
                if duration_mins >= 2040:
                    cycle_on_duty_hours = 0.0
                    shift_driving_minutes = 0
                    shift_duty_window_minutes = 0
                    driving_since_last_break = 0

            if duty_status == DRIVING:
                shift_driving_minutes += duration_mins
                driving_since_last_break += duration_mins
            elif duty_status in [OFF_DUTY, SLEEPER_BERTH] and duration_mins >= 30:
                driving_since_last_break = 0
                
            current_minute = end_min

        # 0. Initial Off-Duty check / Pre-trip setup
        # If current cycle is exhausted (>= 70 hrs), schedule 34-hour restart first!
        if cycle_on_duty_hours >= 70.0:
            add_event(OFF_DUTY, 34 * 60, current_loc["name"], "34-Hour Restart (Cycle Reset)", current_loc["lat"], current_loc["lng"], "RESTART")
            waypoints.append({
                "type": "RESTART",
                "name": "34-Hour Restart",
                "location": current_loc["name"],
                "lat": current_loc["lat"],
                "lng": current_loc["lng"],
                "duration": "34 Hours",
                "description": "34-Hour Cycle Restart taken at origin"
            })
        elif start_departure_minute > 0:
            # Add Off Duty period prior to user-specified departure start time (e.g. 00:00 to 10:00 AM)
            add_event(OFF_DUTY, start_departure_minute, current_loc["name"], "Off Duty (Prior to Departure)", current_loc["lat"], current_loc["lng"])
            
        waypoints.append({
            "type": "START",
            "name": "Start Location",
            "location": current_loc["name"],
            "lat": current_loc["lat"],
            "lng": current_loc["lng"],
            "duration": f"Departure ({start_time_str})",
            "description": f"Trip Departure at {start_time_str}"
        })

        # Pre-trip Inspection (15 mins On Duty)
        add_event(ON_DUTY, 15, current_loc["name"], "Pre-Trip Inspection & Start Duty", current_loc["lat"], current_loc["lng"])

        # Function to simulate driving a segment distance
        def simulate_driving_leg(start_loc, end_loc, distance_miles, coords_list, leg_label):
            nonlocal distance_since_fuel, shift_driving_minutes, shift_duty_window_minutes, driving_since_last_break, cycle_on_duty_hours
            
            remaining_miles = distance_miles
            total_leg_duration_mins = (distance_miles / self.avg_speed_mph) * 60.0
            
            if total_leg_duration_mins <= 0:
                return

            num_coords = len(coords_list)
            
            while remaining_miles > 0.001:
                # Check 70-hour cycle limit!
                if cycle_on_duty_hours >= 70.0:
                    curr_ratio = max(0, min(1, 1 - (remaining_miles / distance_miles)))
                    coord_idx = int(curr_ratio * (num_coords - 1))
                    curr_pt = coords_list[coord_idx] if num_coords > 0 else [start_loc["lat"], start_loc["lng"]]
                    stop_loc_name = f"Rest Area near {leg_label}"
                    
                    add_event(SLEEPER_BERTH, 34 * 60, stop_loc_name, "34-Hour Cycle Restart Triggered", curr_pt[0], curr_pt[1], "RESTART")
                    waypoints.append({
                        "type": "RESTART",
                        "name": "34-Hour Restart",
                        "location": stop_loc_name,
                        "lat": curr_pt[0],
                        "lng": curr_pt[1],
                        "duration": "34 Hours",
                        "description": "Cycle limit reached (70 hrs in 8 days)"
                    })
                    continue

                # Check if 10-hour rest break is required (shift driving >= 11 hrs OR shift duty window >= 14 hrs)
                max_drive_allowed = (11 * 60) - shift_driving_minutes
                max_window_allowed = (14 * 60) - shift_duty_window_minutes
                max_drive_this_shift = min(max_drive_allowed, max_window_allowed)
                
                # Check 30-minute break limit (driving since last break >= 8 hrs)
                max_drive_before_30m = (8 * 60) - driving_since_last_break
                
                # Check fueling limit (every 1000 miles)
                miles_before_fuel = max(0, 1000 - distance_since_fuel)
                mins_before_fuel = (miles_before_fuel / self.avg_speed_mph) * 60.0
                
                # Determine limiting factor for this driving stint
                drive_mins_possible = min(
                    remaining_miles / self.avg_speed_mph * 60.0,
                    max_drive_this_shift,
                    max_drive_before_30m,
                    mins_before_fuel
                )

                if drive_mins_possible <= 1:
                    # We must take a break based on what was hit
                    curr_ratio = max(0, min(1, 1 - (remaining_miles / distance_miles)))
                    coord_idx = int(curr_ratio * (num_coords - 1))
                    curr_pt = coords_list[coord_idx] if num_coords > 0 else [start_loc["lat"], start_loc["lng"]]
                    
                    if max_drive_this_shift <= 1:
                        # Take 10-hour sleeper berth break
                        stop_name = f"10-Hr Rest Stop on {leg_label}"
                        add_event(SLEEPER_BERTH, 10 * 60, stop_name, "10-Hour Mandatory Rest Break", curr_pt[0], curr_pt[1], "REST_10H")
                        waypoints.append({
                            "type": "REST_10H",
                            "name": "10-Hour Rest Break",
                            "location": stop_name,
                            "lat": curr_pt[0],
                            "lng": curr_pt[1],
                            "duration": "10 Hours",
                            "description": "Mandatory 10-hr off-duty rest break"
                        })
                    elif max_drive_before_30m <= 1:
                        # Take 30-minute meal break
                        stop_name = f"30-Min Rest Area on {leg_label}"
                        add_event(OFF_DUTY, 30, stop_name, "30-Minute Mandatory Driving Rest Break", curr_pt[0], curr_pt[1], "REST_30M")
                        waypoints.append({
                            "type": "REST_30M",
                            "name": "30-Min Rest Break",
                            "location": stop_name,
                            "lat": curr_pt[0],
                            "lng": curr_pt[1],
                            "duration": "30 Mins",
                            "description": "Mandatory 30-min break after 8 hrs driving"
                        })
                    elif mins_before_fuel <= 1:
                        # Take 30-minute fueling stop
                        stop_name = f"Fuel Station on {leg_label}"
                        add_event(ON_DUTY, 30, stop_name, "Fueling Vehicle & Inspection", curr_pt[0], curr_pt[1], "FUEL")
                        waypoints.append({
                            "type": "FUEL",
                            "name": "Fuel Stop",
                            "location": stop_name,
                            "lat": curr_pt[0],
                            "lng": curr_pt[1],
                            "duration": "30 Mins",
                            "description": "Fueling stop (required every 1,000 miles)"
                        })
                        distance_since_fuel = 0
                    continue

                # Perform driving stint
                stint_miles = (drive_mins_possible / 60.0) * self.avg_speed_mph
                stint_miles = min(stint_miles, remaining_miles)
                actual_stint_mins = (stint_miles / self.avg_speed_mph) * 60.0

                curr_ratio = max(0, min(1, 1 - ((remaining_miles - stint_miles) / distance_miles)))
                coord_idx = int(curr_ratio * (num_coords - 1))
                curr_pt = coords_list[coord_idx] if num_coords > 0 else [start_loc["lat"], start_loc["lng"]]

                add_event(DRIVING, actual_stint_mins, f"En route to {end_loc['name']}", f"Driving ({stint_miles:.1f} mi)", curr_pt[0], curr_pt[1])
                
                remaining_miles -= stint_miles
                distance_since_fuel += stint_miles

        # 1. Drive to Pickup Location
        if route_to_pickup["distance_miles"] > 0:
            simulate_driving_leg(current_loc, pickup_loc, route_to_pickup["distance_miles"], route_to_pickup["coordinates"], f"Route to {pickup_loc['name']}")
        
        # Pickup Stop: 1 Hour On Duty (Not Driving)
        add_event(ON_DUTY, 60, pickup_loc["name"], "Pickup Cargo & Loading (1 Hr)", pickup_loc["lat"], pickup_loc["lng"], "PICKUP")
        waypoints.append({
            "type": "PICKUP",
            "name": "Pickup Location",
            "location": pickup_loc["name"],
            "lat": pickup_loc["lat"],
            "lng": pickup_loc["lng"],
            "duration": "1 Hour",
            "description": "Cargo pickup and loading"
        })

        # 2. Drive to Dropoff Location
        simulate_driving_leg(pickup_loc, dropoff_loc, route_to_dropoff["distance_miles"], route_to_dropoff["coordinates"], f"Route to {dropoff_loc['name']}")
        
        # Dropoff Stop: 1 Hour On Duty (Not Driving)
        add_event(ON_DUTY, 60, dropoff_loc["name"], "Dropoff Cargo & Unloading (1 Hr)", dropoff_loc["lat"], dropoff_loc["lng"], "DROPOFF")
        waypoints.append({
            "type": "DROPOFF",
            "name": "Dropoff Location",
            "location": dropoff_loc["name"],
            "lat": dropoff_loc["lat"],
            "lng": dropoff_loc["lng"],
            "duration": "1 Hour",
            "description": "Cargo delivery and unloading"
        })
        
        # Final Post-Trip Inspection & Off Duty
        add_event(ON_DUTY, 15, dropoff_loc["name"], "Post-Trip Inspection", dropoff_loc["lat"], dropoff_loc["lng"])
        add_event(OFF_DUTY, 60, dropoff_loc["name"], "End Duty / Off Duty", dropoff_loc["lat"], dropoff_loc["lng"])

        # 3. Process Events into Daily 24-Hour Paper Log Sheets (Midnight to Midnight)
        daily_logs = self._split_events_into_daily_logs(
            events=events,
            origin_loc=current_loc,
            dest_loc=dropoff_loc,
            total_miles=route_to_pickup["distance_miles"] + route_to_dropoff["distance_miles"],
            carrier_name=carrier_name,
            truck_number=truck_number,
            driver_name=driver_name
        )

        # Compute summary stats
        total_trip_miles = route_to_pickup["distance_miles"] + route_to_dropoff["distance_miles"]
        total_duration_hours = round(current_minute / 60.0, 1)
        total_driving_hours = round(sum(e["duration_hours"] for e in events if e["duty_status"] == DRIVING), 1)
        total_on_duty_not_driving = round(sum(e["duration_hours"] for e in events if e["duty_status"] == ON_DUTY), 1)
        total_off_duty_sleeper = round(sum(e["duration_hours"] for e in events if e["duty_status"] in [OFF_DUTY, SLEEPER_BERTH]), 1)

        return {
            "summary": {
                "total_miles": total_trip_miles,
                "total_trip_hours": total_duration_hours,
                "total_driving_hours": total_driving_hours,
                "total_on_duty_hours": round(total_driving_hours + total_on_duty_not_driving, 1),
                "total_off_duty_hours": total_off_duty_sleeper,
                "total_days": len(daily_logs),
                "initial_cycle_used": self.current_cycle_used,
                "final_cycle_used": round(cycle_on_duty_hours, 1),
                "fuel_stops_count": len([w for w in waypoints if w["type"] == "FUEL"]),
                "rest_stops_count": len([w for w in waypoints if w["type"] in ["REST_10H", "RESTART"]])
            },
            "waypoints": waypoints,
            "daily_logs": daily_logs,
            "events_timeline": events
        }

    def _split_events_into_daily_logs(
        self,
        events,
        origin_loc,
        dest_loc,
        total_miles,
        carrier_name="Apex Freight Logistics",
        truck_number="TRK-709 / TRL-402",
        driver_name="John Doe"
    ):
        """
        Splits a continuous timeline of events into 24-hour daily log sheet datasets (00:00 to 24:00).
        """
        if not events:
            return []

        max_minute = events[-1]["end_minute"]
        total_days = math.ceil(max_minute / (24 * 60))
        if total_days == 0:
            total_days = 1

        daily_logs = []
        
        running_cycle_on_duty = self.current_cycle_used

        for day_idx in range(total_days):
            day_num = day_idx + 1
            day_start_min = day_idx * 24 * 60
            day_end_min = (day_idx + 1) * 24 * 60
            
            day_intervals = []
            remarks_list = []

            off_duty_mins = 0
            sleeper_mins = 0
            driving_mins = 0
            on_duty_mins = 0
            miles_today = 0.0

            # Find all events overlapping with this day's 24-hour window
            for ev in events:
                # Check overlap
                overlap_start = max(day_start_min, ev["start_minute"])
                overlap_end = min(day_end_min, ev["end_minute"])
                
                if overlap_start < overlap_end:
                    dur_mins = overlap_end - overlap_start
                    st_in_day = overlap_start - day_start_min
                    et_in_day = overlap_end - day_start_min
                    
                    status = ev["duty_status"]
                    
                    if status == OFF_DUTY:
                        off_duty_mins += dur_mins
                    elif status == SLEEPER_BERTH:
                        sleeper_mins += dur_mins
                    elif status == DRIVING:
                        driving_mins += dur_mins
                        miles_today += (dur_mins / 60.0) * self.avg_speed_mph
                    elif status == ON_DUTY:
                        on_duty_mins += dur_mins

                    day_intervals.append({
                        "start_time_str": self._format_min_to_time(st_in_day),
                        "end_time_str": self._format_min_to_time(et_in_day),
                        "start_minute_of_day": st_in_day,
                        "end_minute_of_day": et_in_day,
                        "duration_hours": round(dur_mins / 60.0, 2),
                        "duty_code": status,
                        "duty_name": DUTY_NAMES[status],
                        "location": ev["location"],
                        "remarks": ev["remarks"]
                    })
                    
                    # Add remark entry if event starts within this day
                    if ev["start_minute"] >= day_start_min and ev["start_minute"] < day_end_min:
                        remarks_list.append({
                            "time": self._format_min_to_time(st_in_day),
                            "location": ev["location"],
                            "description": ev["remarks"]
                        })

            # Guarantee 24 hours total coverage
            tot_mins = off_duty_mins + sleeper_mins + driving_mins + on_duty_mins
            if tot_mins < 1440:
                fill_mins = 1440 - tot_mins
                off_duty_mins += fill_mins
                day_intervals.append({
                    "start_time_str": self._format_min_to_time(1440 - fill_mins),
                    "end_time_str": "24:00",
                    "start_minute_of_day": 1440 - fill_mins,
                    "end_minute_of_day": 1440,
                    "duration_hours": round(fill_mins / 60.0, 2),
                    "duty_code": OFF_DUTY,
                    "duty_name": DUTY_NAMES[OFF_DUTY],
                    "location": dest_loc["name"] if day_num == total_days else "En Route",
                    "remarks": "Off Duty"
                })

            off_h = round(off_duty_mins / 60.0, 2)
            slp_h = round(sleeper_mins / 60.0, 2)
            drv_h = round(driving_mins / 60.0, 2)
            ond_h = round(on_duty_mins / 60.0, 2)
            
            # Adjustment for exact 24.0 total rounding
            row_sum = off_h + slp_h + drv_h + ond_h
            if abs(row_sum - 24.0) > 0.001:
                off_h = round(24.0 - (slp_h + drv_h + ond_h), 2)

            on_duty_today = round(drv_h + ond_h, 2)
            running_cycle_on_duty += on_duty_today
            avail_tomorrow = max(0.0, round(70.0 - running_cycle_on_duty, 2))

            from_loc = origin_loc["name"] if day_num == 1 else "En Route"
            to_loc = dest_loc["name"] if day_num == total_days else "En Route"

            daily_logs.append({
                "day_number": day_num,
                "day_label": f"Day {day_num}",
                "from_location": from_loc,
                "to_location": to_loc,
                "total_miles_today": round(miles_today, 1),
                "total_miles_trip": round(total_miles, 1),
                "carrier_name": carrier_name,
                "home_terminal": origin_loc["name"],
                "truck_number": truck_number,
                "driver_name": driver_name,
                "totals": {
                    "off_duty": off_h,
                    "sleeper_berth": slp_h,
                    "driving": drv_h,
                    "on_duty": ond_h,
                    "total_day_hours": 24.0
                },
                "intervals": day_intervals,
                "remarks": remarks_list,
                "recap": {
                    "on_duty_today": on_duty_today,
                    "total_last_7_days": round(running_cycle_on_duty, 1),
                    "available_tomorrow": avail_tomorrow
                }
            })

        return daily_logs

    def _format_min_to_time(self, minutes_of_day: int) -> str:
        h = int(minutes_of_day // 60)
        m = int(minutes_of_day % 60)
        return f"{h:02d}:{m:02d}"
