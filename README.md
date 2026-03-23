# VeggieMap - Hyperlocal Vegetable Vendor Finder 🥦📍

VeggieMap is a real-time, hyperlocal marketplace connecting consumers with static vegetable shops and mobile hawkers. It utilizes geospatial technology to show vendors on a live map, allowing users to find fresh produce nearby.

## 🏗️ System Architecture

The application is built using the **MERN Stack** (MongoDB, Express.js, React/Next.js, Node.js) with a heavy focus on real-time geospatial data.

### 1. Backend Architecture (Node.js & Express)
The backend acts as the central hub for data persistence and real-time communication.

*   **Database (MongoDB):**
    *   **Geospatial Indexing:** Uses MongoDB's `2dsphere` index on the `Vendor` collection (`location` field) to perform efficient proximity searches (`$near`, `$geoWithin`).
    *   **Models:**
        *   `Vendor`: Stores profile, inventory (embedded menu), type (`static` vs `mobile`), and live location.
        *   `Consumer`: Stores user preferences and favorites.
        *   `SearchTag`: Optimizes search by indexing keywords related to vendors.
*   **API Layer (Express.js):**
    *   RESTful endpoints for Authentication (`/auth`), Vendor Management (`/vendor`), and Consumer Actions (`/consumer`).
    *   Secure file uploads for shop images using `Multer`.
*   **Real-Time Engine (Socket.io):**
    *   **Geo-Room Partitioning:** To scale, the world is divided into "Geo-Rooms" (e.g., `geo-28-77` based on lat/trunc-lng). Users only receive updates from vendors in their current grid.
    *   **Events:**
        *   `vendor:location-update`: Mobile vendors push coordinates.
        *   `vendor:location-move`: Broadcasts new coords to consumers in the room.
        *   `vendor:online` / `disconnect`: Manages live status.

### 2. Frontend Architecture (Next.js 16 & TypeScript)
The frontend is a Progressive Web App (PWA) optimized for performance and mobile usage.

*   **Framework:** Next.js 16 (App Router) for hybrid rendering (Server Components for SEO, Client Components for interactivity).
*   **Map System:**
    *   **Leaflet & React-Leaflet:** Renders the interactive map.
    *   **Supercluster:** Handles marker clustering for performance when thousands of vendors are visible.
    *   **Custom Icons:** Distinct markers for Static Shops (Vegetable/Store icon) vs. Mobile Hawkers (Rickshaw/Cart icon).
*   **State Management:**
    *   **Zustand:** Global client state (Map Center, Zoom, User Location, Selected Vendor).
    *   **TanStack Query:** Server state management (caching vendor lists, favorites, and eliminating prop drilling).
*   **Styling:** Tailwind CSS with Radix UI primitives for accessible, high-performance components.

---

## � Real-Time Data Flow & WebSockets (Deep Dive)

The core feature of VeggieMap is the ability to see moving hawkers in real-time. Here is exactly how data travels from a vendor's phone to a consumer's screen.

```mermaid
graph TD
    %% Actors
    VendorMobile[📱 Mobile Vendor\n(Hawker)]
    VendorStatic[🏪 Static Shop]
    Consumer[🛒 Consumer User]

    %% Backend System
    subgraph Cloud Infrastructure
        LB[Load Balancer / Nginx]
        API[🚀 Backend API\n(Express + Socket.io)]
        DB[(🍃 MongoDB\nGeo-Spatial Index)]
    end

    %% Flows
    VendorMobile -->|Socket: location-update\n(Lat, Lng)| API
    VendorStatic -->|REST: update-inventory| API
    
    API -->|Persist Location & Stock| DB
    API -->|Query: Nearby Vendors| DB
    
    API -->|Socket Broadcast\n(Geo-Room: 'geo-28-77')| Consumer
    
    Consumer -->|REST: Get Initial Map| API
    Consumer -->|Socket: Join Room| API

    %% Styling
    style VendorMobile fill:#ff9f43,stroke:#333,stroke-width:2px
    style VendorStatic fill:#1dd1a1,stroke:#333,stroke-width:2px
    style Consumer fill:#54a0ff,stroke:#333,stroke-width:2px
    style API fill:#a29bfe,stroke:#333,stroke-width:2px
    style DB fill:#55efc4,stroke:#333,stroke-width:2px
```

### 1. The Connection Handshake
1.  **Client Initialization:** When a user (Vendor or Consumer) logs in, `SocketContext.tsx` initializes a Socket.io connection to the backend.
2.  **Authentication:**
    *   The client emits an `auth` event with their JWT token.
    *   The server verifies the token, decodes the `userId`, and looks up the user in MongoDB.
    *   **Server Logic:** The server assigns the socket a role (`vendor` or `consumer`) and stores it in an `activeClients` in-memory map.
    *   **Success:** The server emits `auth:success`, and the client sets `isAuthenticated = true`.

### 2. The "Geo-Room" Strategy (Scalability)
To prevent broadcasting every location update to every user (which would crash the server), we use **Spatial Partitioning**.
*   **Logic:** The world is divided into 1x1 degree grids (approx. 111km x 111km).
*   **Naming:** A grid at Lat 28.5, Lng 77.2 is named `geo-28-77`.
*   **Joining:**
    *   **Consumers:** When a consumer moves their map, they emit `consumer:join-room` with their center coordinates. The server calculates the grid and joins their socket to that room.
    *   **Vendors:** Mobile vendors do not explicitly "join" a room to listen; they *broadcast* to the room matching their current GPS location.

### 3. The Location Update Loop (The "Uber" Effect)
This loop happens every few seconds for moving vendors:

```mermaid
sequenceDiagram
    participant Mobile as 📱 Vendor App
    participant Server as 🚀 Socket Server
    participant DB as 🍃 MongoDB
    participant Consumer as 🛒 Consumer App

    Note over Mobile, Consumer: Continuous Location Tracking Loop

    Mobile->>Mobile: GPS Change Detected
    Mobile->>Server: emit("vendor:location-update", {lat, lng})
    
    Server->>Server: Verify Token & Role
    
    parallel Server Actions
        Server->>DB: Update Vendor.location
        and
        Server->>Server: Calculate Geo-Room (e.g., "geo-28-77")
    end
    
    Server->>Consumer: Broadcast to "geo-28-77": "vendor:location-move"
    
    Consumer->>Consumer: Update Local State (React Query)
    Consumer->>Consumer: Animate Marker (Leaflet)
```

1.  **Vendor Side (Mobile):**
    *   `navigator.geolocation.watchPosition` detects a change.
    *   Client emits `vendor:location-update` with `{ lat, lng }`.
2.  **Server Side:**
    *   Validates the socket is an authenticated vendor.
    *   **Persist:** Updates `Vendor.location` in MongoDB (so fresh page loads see the new spot).
    *   **Calculate Room:** Determines current Geo-Room (e.g., `geo-28-77`).
    *   **Broadcast:** `io.to('geo-28-77').emit('vendor:location-move', data)`
3.  **Consumer Side:**
    *   Socket listener receives `vendor:location-move`.
    *   **React Query / Zustand:** The local state for that specific vendor ID is updated.
    *   **React Leaflet:** The marker smoothly animates to the new coordinate.

### 4. Handling Disconnections & Live Status
*   **Heartbeat:** Socket.io maintains a heartbeat. If a vendor loses network or closes the app, the server detects a `disconnect` event.
*   **Cleanup:**
    *   **Mobile Vendors:** The server emits `vendor:removed` to the room, and the vendor's marker is immediately removed from consumer maps.
    *   **Static Shops:** The server emits `vendor:status-update` with `{ isOnline: false }`, turning their marker gray/closed on the map.


---

## �🚀 How It Works

### 🛒 Consumer Flow
1.  **Geolocation:** On open, the app requests GPS permissions to center the map.
2.  **Discovery:**
    *   **Initial Load:** Fetches nearby vendors via REST API based on map bounds.
    *   **Live Updates:** Connects to Socket.io and joins a specific "Geo-Room".
3.  **Interaction:** Tapping a marker opens a `VendorCard` with menu items, prices, and "Navigate" button.

### 🏪 Vendor Flow (Static)
1.  **Registration:** Vendor signs up and sets their fixed shop location on a map.
2.  **Inventory:** Manages "In-Stock" / "Out-of-Stock" status for vegetables via the Dashboard.
3.  **Status:** Toggles "Online/Offline" to indicate shop opening hours.

### 🚲 Mobile Vendor Flow (The "Hawker" System)
**Current Status:**
*   Vendors with `vendorType: 'mobile'` are treated as moving entities.
*   **Tracking:** When a mobile vendor goes "Online", the browser/app begins watching their GPS position (`navigator.geolocation.watchPosition`).
*   **Broadcasting:** Updates are emitted to the server via `socket.emit('vendor:location-update')`.
*   **Persistence:** The server updates the MongoDB document *and* immediately broadcasts the new location to relevant consumers, creating a "Uber-like" smooth movement effect on the consumer's map.

---

## 🔮 Future Plans & Roadmap

### 📱 Mobile Vendor App (Deep Dive)
To truly empower hawkers (cart vendors), a dedicated mobile app is planned with the following capabilities:

1.  **Background Location Service:**
    *   **Problem:** Browsers throttle GPS when the screen is off.
    *   **Solution:** A React Native / Flutter app using interaction-free background location services. This allows the vendor to keep the phone in their pocket while the system tracks their cart's movement through neighborhoods.
2.  **Battery Optimization:**
    *   Smart tracking algorithms that reduce GPS polling frequency when the vendor stops moving (e.g., serving a customer).
3.  **Route Analytics:**
    *   Heatmaps showing where they got the most business previously.
4.  **Vocals/Announcements:**
    *   "Digital Bell": Consumers can get a push notification when their favorite tomato seller enters their street.

### 🛠 Upcoming Additions
1.  **Offline-First Architecture:**
    *   Full implementation of `tanstack-query` persistence to load the map and last-known vendors instantly, even with patchy network.
2.  **Payment Integration:**
    *   UPI integration (PhonePe/Razorpay) for direct payments to vendors.
3.  **Social Proof:**
    *   Ratings and Reviews for vendors to build trust.
4.  **Vendor Verification:**
    *   Admin panel for verifying vendor KYC (Aadhar/FSSAI) to ensure safety.

---

## 📍 Current Status
*   **Core Map:** ✅ Functional with Clustering and Custom Markers.
*   **Real-time:** ✅ Semantic "Geo-Rooms" implemented for scalable socket broadcasting.
*   **Dashboard:** ✅ Vendors can manage inventory and profile images.
*   **Search:** ✅ Text-based search for products and shop names.
*   **Favorites:** ✅ Consumers can save their favorite local vendors.
