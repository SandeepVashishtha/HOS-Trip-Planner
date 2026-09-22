# HOS Trip Planner

Commercial Route Planner and FMCSA Hours-of-Service (HOS) Electronic Logging Device (ELD) Daily Log Generator.

This system calculates compliant commercial driving routes based on United States Federal Motor Carrier Safety Administration (FMCSA) property-carrying regulations (49 CFR Part 395) and automatically generates official 24-hour Record of Duty Status (RODS) Daily Log Sheets.

---

## Live Deployments

* **Frontend Application**: [https://hos-trip-planner-khaki.vercel.app/](https://hos-trip-planner-khaki.vercel.app/)
* **Backend API Base**: [https://hos-trip-django-backend-egejbad7d4c2d3bd.centralindia-01.azurewebsites.net/](https://hos-trip-django-backend-egejbad7d4c2d3bd.centralindia-01.azurewebsites.net/)
* **Interactive API Documentation (Swagger UI)**: [https://hos-trip-django-backend-egejbad7d4c2d3bd.centralindia-01.azurewebsites.net/api/docs/](https://hos-trip-django-backend-egejbad7d4c2d3bd.centralindia-01.azurewebsites.net/api/docs/)
* **ReDoc API Reference**: [https://hos-trip-django-backend-egejbad7d4c2d3bd.centralindia-01.azurewebsites.net/api/redoc/](https://hos-trip-django-backend-egejbad7d4c2d3bd.centralindia-01.azurewebsites.net/api/redoc/)
* **Source Code Repository**: [https://github.com/SandeepVashishtha/HOS-Trip-Planner](https://github.com/SandeepVashishtha/HOS-Trip-Planner)

---

## Overview

Long-haul property-carrying commercial vehicle drivers must adhere strictly to FMCSA regulations regarding maximum driving hours, mandatory rest periods, on-duty limits, and cycle resets. 

HOS Trip Planner automates the calculation of:
1. Turn-by-turn route geometry and geographic waypoints.
2. Mandatory 30-minute rest breaks after 8 hours of cumulative driving.
3. 10-hour consecutive sleeper berth rest periods before exceeding the 11-hour driving or 14-hour duty windows.
4. Fuel and vehicle inspection stops every 1,000 miles.
5. 1-hour loading and unloading on-duty durations at pickup and dropoff locations.
6. 70-hour / 8-day cycle tracking with automatic 34-hour restart scheduling when cycle hours are exhausted.
7. Official FMCSA 24-hour RODS log sheet generation with complete 4-tier duty grid graphing, remarks logs, recap tables, and multi-page PDF/PNG export.

---

## FMCSA HOS Rules Implemented

The calculation engine enforces the following property-carrying commercial motor vehicle rules under **49 CFR Part 395**:

| Regulation Rule | Constraint | Implementation in Engine |
| :--- | :--- | :--- |
| **11-Hour Driving Limit** | Max 11 hours of driving per duty shift | Requires a mandatory 10-hour consecutive rest break before driving resumes. |
| **14-Hour Duty Window** | Cannot drive past the 14th consecutive hour after coming on duty | Rest periods and on-duty activities count toward the 14-hour consecutive window. |
| **30-Minute Rest Break** | Mandatory break after 8 cumulative hours of driving | Inserts a 30-minute off-duty rest break at a safe waypoint. |
| **10-Hour Sleeper Berth** | 10 consecutive hours off-duty | Resets the 11-hour driving and 14-hour duty windows. |
| **70-Hour / 8-Day Limit** | Cannot drive after 70 on-duty hours in any 8 consecutive days | Continuously calculates accumulated cycle hours. |
| **34-Hour Restart** | 34 consecutive hours off-duty | Triggers a 34-hour reset whenever accumulated hours reach the 70-hour cycle limit. |
| **Fueling Rule** | Fuel stop at least once every 1,000 miles | Inserts a 30-minute on-duty fueling stop at 1,000-mile milestones. |
| **Pickup & Dropoff** | Loading and unloading operations | Allocates 1 hour of On-Duty (Not Driving) time for cargo handling at pickup and dropoff points. |

---

## Architecture and Tech Stack

### Frontend
* **Framework**: React 19, Vite
* **Styling**: Vanilla CSS with custom design tokens, modern typography (Inter), and responsive grid systems
* **Mapping**: Leaflet, React-Leaflet, Carto Basemaps (Voyager)
* **Log Sheet Rendering**: HTML5 Canvas (high-DPI 2x pixel density)
* **Export Engine**: jsPDF, html2canvas

### Backend
* **Framework**: Python 3.12, Django 5.x, Django REST Framework
* **API Documentation**: drf-spectacular (OpenAPI 3.0 / Swagger UI / ReDoc)
* **Routing & Geometry**: Open Source Routing Machine (OSRM) API
* **Geocoding**: Komoot Photon API (OpenStreetMap-based)
* **Hosting**: Microsoft Azure App Service (Linux)

---

## User Interface and Layout

1. **Landing Page**:
   * Centered minimalist search card.
   * Input fields for **Current Location (From)**, **Pickup Location**, and **Dropoff Location** with location search autocomplete and swap functionality.
   * Interactive **Current Cycle Used** slider (0 to 70 hours) indicating remaining available duty hours.
   * Regulatory compliance summary strip.

2. **Results Page**:
   * **Top Bar**: Summary statistics strip (Total Miles, Driving Hours, Trip Duration in Days, Fuel Stops, 30-Min Breaks, and 70h Cycle Status) along with an `Edit Trip Parameters` navigation button.
   * **Side-by-Side Row**:
     * **Left**: Stops & Itinerary scrollable panel with color-coded waypoint badges, geographic names, descriptions, and durations.
     * **Right**: Route Map rendering the polyline path, interactive markers, and auto-fit boundary controls.
   * **FMCSA ELD Log Sheets**:
     * Multi-day tab navigation for multi-day trips.
     * Complete 24-hour graph grid with red duty status stepping line (Off Duty, Sleeper Berth, Driving, On Duty).
     * Remarks section detailing timestamps, locations, and duty changes.
     * 70-Hour / 8-Day Recap Box with on-duty today, available tomorrow, and 7-day cumulative totals.
     * Export tools: Single Day PNG, Single Day PDF, and Multi-Day Merged PDF.

---

## API Endpoints

### 1. Plan Trip
* **URL**: `/api/plan-trip/`
* **Method**: `POST`
* **Content-Type**: `application/json`

#### Request Body
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 15.0
}
```

#### Response Structure
```json
{
  "summary": {
    "total_miles": 980.5,
    "total_driving_hours": 17.8,
    "total_trip_hours": 42.5,
    "total_days": 2,
    "fuel_stops_count": 1,
    "rest_stops_count": 2,
    "initial_cycle_used": 15.0,
    "final_cycle_used": 34.8,
    "cycle_exceeded": false
  },
  "routes": {
    "full_path_coordinates": [
      [41.8781, -87.6298],
      [39.7684, -86.1581],
      [32.7767, -96.7970]
    ]
  },
  "waypoints": [
    {
      "name": "Current Location",
      "type": "START",
      "location": "Chicago, IL",
      "lat": 41.8781,
      "lng": -87.6298,
      "description": "Trip Departure",
      "duration": null
    },
    {
      "name": "Pickup Location",
      "type": "PICKUP",
      "location": "Indianapolis, IN",
      "lat": 39.7684,
      "lng": -86.1581,
      "description": "Cargo Loading (1 Hr)",
      "duration": "1 hr"
    }
  ],
  "daily_logs": [
    {
      "day_number": 1,
      "from_location": "Chicago, IL",
      "to_location": "En route to Dallas, TX",
      "total_miles_today": 550.0,
      "total_miles_trip": 550.0,
      "truck_number": "TRK-709 / TRL-402",
      "carrier_name": "Apex Freight Logistics",
      "home_terminal": "Chicago, IL",
      "totals": {
        "off_duty": 10.0,
        "sleeper_berth": 0.0,
        "driving": 10.0,
        "on_duty": 4.0
      },
      "intervals": [
        {
          "duty_code": 1,
          "duty_name": "Off Duty",
          "start_time_str": "00:00",
          "end_time_str": "08:00",
          "duration_hours": 8.0,
          "location": "Chicago, IL",
          "remarks": "Off Duty"
        }
      ],
      "remarks": [
        {
          "time": "08:00",
          "location": "Chicago, IL",
          "description": "Start of Day / Pre-Trip Inspection"
        }
      ],
      "recap": {
        "on_duty_today": 14.0,
        "available_tomorrow": 41.0,
        "total_last_7_days": 29.0
      }
    }
  ]
}
```

### 2. Health Check
* **URL**: `/api/health/`
* **Method**: `GET`
* **Response**: `{"status": "healthy", "service": "HOS Trip Planner API"}`

---

## Local Development Setup

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* Git

### 1. Clone Repository
```bash
git clone https://github.com/SandeepVashishtha/HOS-Trip-Planner.git
cd HOS-Trip-Planner
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start local server
python manage.py runserver
```
The backend API will be available at `http://127.0.0.1:8000/`.

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create local environment configuration (.env)
# VITE_API_BASE_URL=http://127.0.0.1:8000
# VITE_CARTO_API_KEY=your_carto_api_key

# Start development server
npm run dev
```
The frontend web application will be accessible at `http://localhost:5173/`.

---

## Running Automated Tests

To execute backend unit tests for the HOS calculation engine, API validation, and routing integration:
```bash
cd backend
python manage.py test api
```

To execute frontend static analysis:
```bash
cd frontend
npm run lint
npm run build
```

---

## License

This project is licensed under the MIT License.
