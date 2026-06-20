# Unimplemented Features

## ✅ Implemented: Dashboard Tab Navigation
- **What:** The main dashboard tab navigation visually selects tabs but doesn't change the underlying view or component.
- **Where:** `frontend/src/app/dashboard/page.tsx` (Lines 73-77)
- **Expected behavior:** Clicking tabs like "Analytics" or "Resources" should conditionally render the corresponding modules or route to them.
- **Current state:** It updates a local `tab` state via `onChange={setTab}`, but the `tab` variable is completely ignored in the page render block.

## ✅ Implemented: Dashboard StatCard Mock Data
- **What:** The KPI StatCard for Active Incidents displays a hardcoded percentage change.
- **Where:** `frontend/src/app/dashboard/page.tsx` (Line 86)
- **Expected behavior:** Should fetch historical KPI data and calculate the delta percentage over time.
- **Current state:** Hardcoded as `percentage={12} // Mock change`.

## ✅ Implemented: Dashboard StatisticsPanel Chart Data
- **What:** The 7-day incident trend chart is rendered using static placeholder data.
- **Where:** `frontend/src/app/dashboard/page.tsx` (Lines 40-49)
- **Expected behavior:** Data should be dynamically fetched from the API (e.g. `/analytics/trends`).
- **Current state:** `const trendData = [...] // Mock trend data` array.

## ✅ Implemented: New Incident Voice Recording (Speech-to-Text)
- **What:** The microphone recording feature visualizes recording state but discards the audio.
- **Where:** `frontend/src/app/incidents/new/page.tsx` (Lines 74-76)
- **Expected behavior:** The recorded `audioChunksRef` blob should be sent via POST to an STT service (e.g., Whisper API) to return transcribed text.
- **Current state:** Audio is discarded and a static `demoTranscript` string is injected into the text field.

## ✅ Implemented: Station Resources Update Endpoint
- **What:** The "Save Changes" action in the Station Resources inventory manager is incomplete.
- **Where:** `frontend/src/app/resources/page.tsx` (Line 64)
- **Expected behavior:** Modifying resource limits and clicking Save should call a PUT endpoint to update the station's total resources in the database.
- **Current state:** Contains an empty comment `// TODO: PUT /stations/{id} with updated total`.

## ✅ Implemented: ML Module Health Check Fallback
- **What:** The admin system-health endpoint fakes the health status of the Machine Learning module.
- **Where:** `backend/routes/admin.py` (Line 38)
- **Expected behavior:** Should make a live network request to the ML inference service to verify uptime and model versions.
- **Current state:** Has a comment `// Since ML module details are in final_endpoints, we mock the response here` and returns a hardcoded "OK" status.

## ✅ Implemented: Sidebar Settings Navigation
- **What:** The Sidebar contains a Settings link pointing to a route that hasn't been created yet.
- **Where:** `frontend/src/components/layout/Sidebar.tsx` (Line 58)
- **Expected behavior:** Navigates the user to a settings view for profile and preferences management.
- **Current state:** `href="/settings"` leads to a 404 page because the route does not exist in `frontend/src/app/`.

## ✅ Implemented: Topbar Notifications (Bell Icon)
- **What:** The Topbar bell icon for notifications is purely decorative.
- **Where:** `frontend/src/components/layout/Topbar.tsx` (Lines 58-65)
- **Expected behavior:** Opens a dropdown or side-panel showing recent system alerts and notifications.
- **Current state:** Rendered as a simple `<button>` with no `onClick` handler or state logic.

## ✅ Implemented: Right Panel Quick Links
- **What:** The list of Quick Links on the dashboard (Documentation, Risk Zones, Feedback, Analytics, Audit Log) are not interactive.
- **Where:** `frontend/src/components/layout/RightPanel.tsx` (Lines 40-60)
- **Expected behavior:** Each item should be wrapped in a `<Link>` or `<a>` tag to route the user to the corresponding module.
- **Current state:** Rendered as un-clickable `<div>` blocks despite having an outward arrow icon meant to imply navigation.

---

## ✅ Implemented: Dedicated Incident Detail Page
- **What:** No proper incident detail page existed — `/incidents/[id]` just redirected to dispatch.
- **Where:** `frontend/src/app/incidents/[id]/page.tsx`
- **Implemented:**
  - Full detail view: type, cause, vehicle, location, status, priority, transcript, timestamps
  - ML model predictions panel (priority, confidence, resolution time, road closure)
  - Embedded Mapbox map pinning the incident location
  - "Allocate Resources" button opening a modal with station selection
  - Historical similar incidents sidebar (via FAISS semantic search)
  - "Submit Feedback" quick action linking to feedback form pre-filled with incident ID

## ✅ Implemented: Right Panel Replacement
- **What:** The right panel showed static documentation links and had no live data.
- **Where:** `frontend/src/components/layout/RightPanel.tsx`
- **Implemented:**
  - Live KPI stat grid (active incidents, resources deployed, avg resolution, P1 count)
  - Scrollable live activity feed of the 5 most recent active incidents with priority badges, status icons, time-ago stamps
  - Critical P1 alert banner when any critical incidents are present
  - All items are clickable and navigate to incident detail pages

## ✅ Implemented: Dashboard — Live Incidents as Primary Focus
- **What:** Live incident queue was buried below stat cards and the chart.
- **Where:** `frontend/src/app/dashboard/page.tsx`
- **Implemented:**
  - Live Incident Queue moved to row 1 (top of the grid), full 8-column width
  - Active incident count badge in the queue header
  - Stat cards and trend chart moved to rows 2 and 3 below

## ✅ Implemented: New Incident Popup Notification
- **What:** No real-time alerts when new incidents arrived.
- **Where:** `frontend/src/app/dashboard/page.tsx`
- **Implemented:**
  - Polling every 15s compares incident IDs; new ones trigger a toast notification
  - Toast shows: incident type, location, priority badge, incident ID, and a "View Incident" link
  - Toast auto-dismisses after 8 seconds
  - DEV-mode "Test Alert" button in the queue header to simulate receiving an external P1 incident

## ✅ Implemented: Feedback Form with Database Storage
- **What:** No feedback form or backend route with the requested fields existed.
- **Where:** `frontend/src/app/feedback/page.tsx` + `backend/routes/extended_feedback.py`
- **Implemented:**
  - Frontend form with fields: `incident_id`, `actual_priority`, `actual_closure` (checkbox), `actual_resolution_time`, `officers_used`, `barricades_used`, `remarks`
  - Pre-fills `incident_id` from URL `?incident_id=` query param (linked from incident detail page)
  - POSTs to `POST /feedback` on submit
  - New `ExtendedFeedback` SQLAlchemy model creates the `extended_feedback` table automatically
  - Shows success state with "Submit Another" button; shows error message on failure

## ✅ Implemented: Map View — Incidents Only with Pulsing Styled Markers
- **What:** Map showed station markers by default; incident markers had no animation.
- **Where:** `frontend/src/components/map/BengaluruMap.tsx`
- **Implemented:**
  - Station layer is now toggled OFF by default (still available via layer controls)
  - All incident markers replaced with pulsing circular animation using CSS keyframes injected once into document head
  - Priority-differentiated colors: 🔴 P1=red (fast pulse), 🟡 P2=orange, P3=yellow, 🔵 P4=cyan; IN_PROGRESS=blue
  - Clicking an incident marker navigates to its detail page (`/incidents/[id]`)
