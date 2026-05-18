# VeggieMap — Final Project Report

**Project Title:** VeggieMap — Hyperlocal Vegetable Vendor Finder  
**Version:** 1.0 (Production)  
**Deployed URL:** https://veggiemap.codewithvin.app  
**Stack:** MERN (MongoDB · Express.js · Next.js · Node.js)  
**Date:** March 2026  

---

## 1. Project Overview

VeggieMap is a real-time, hyperlocal marketplace that bridges the gap between consumers and local vegetable vendors — both static shops and mobile hawkers (cart vendors). By combining geospatial technology with WebSocket-based live tracking, consumers can see vendors on a live map, discover their inventory, and navigate to them.

### Problem Statement

India's vegetable supply chain is dominated by unorganized street vendors and small local shops that are invisible to most consumers beyond their immediate neighborhood. Consumers have no way to:
- Know which vegetable shops are open and nearby.
- Track mobile cart vendors moving through streets.
- See real-time stock/pricing before walking to a vendor.

### Solution

VeggieMap provides a GPS-powered map interface where:
- **Static vendors** register their shop location and manage live inventory.
- **Mobile hawkers** broadcast their GPS position in real-time as they move through neighborhoods.
- **Consumers** see all nearby vendors on a live map, can search by product/shop name, and save favorites.

---

## 2. System Architecture

The application follows a classic MERN architecture with a real-time layer built on Socket.io.

```
┌─────────────────────────────────────────────────────────────┐
│                     EC2 (Ubuntu 22.04)                      │
│                                                             │
│   ┌─────────────┐      HTTPS/WSS      ┌────────────────┐    │
│   │   Nginx     │ ←── Port 443 ──────→│  Internet /    │    │
│   │  (Reverse   │                     │  Browser       │    │
│   │   Proxy)    │                     └────────────────┘    │
│   └──────┬──────┘                                           │
│          │                                                  │
│    ┌─────┴───────────────────┐                              │
│    │                         │                              │
│    ▼ :3000                   ▼ :5000                        │
│  ┌─────────────┐    ┌─────────────────┐                     │
│  │  Next.js    │    │  Express.js +   │                     │
│  │  Frontend   │    │  Socket.io      │                     │
│  │  (PM2)      │    │  Backend (PM2)  │                     │
│  └─────────────┘    └────────┬────────┘                     │
│                              │                              │
│                     ┌────────▼────────┐                     │
│                     │   MongoDB Atlas │                     │
│                     │ (Cloud Database)│                     │
│                     └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Backend (Node.js + Express.js)

| Component | Technology | Purpose |
|---|---|---|
| HTTP Server | `http` (Node core) | Hosts Express and Socket.io on the same port |
| API Framework | Express.js 4.x | RESTful routes |
| Real-Time Engine | Socket.io 4.7.5 | WebSocket server for live vendor tracking |
| Authentication | JWT (jsonwebtoken 9.x) + bcryptjs | Stateless auth tokens, password hashing |
| Database ORM | Mongoose 8.4.x | MongoDB document modeling |
| File Uploads | Multer 2.x | Multipart form handling for shop/product images |
| Environment | dotenv 16.x | Environment variable management |

**Production entry:** [Backend/server.js](file:///c:/Users/VINAY/Desktop/VM/Seller/Backend/server.js)  
**Process manager:** PM2 (single fork instance — required for Socket.io sticky sessions)

### 2.2 Frontend (Next.js 16 + TypeScript)

| Component | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16.1.6 (App Router) | Hybrid SSR/CSR rendering |
| Language | TypeScript 5.x | Type safety across the entire codebase |
| Runtime | React 19.2.3 + React DOM 19 | Latest concurrent rendering features |
| Map Rendering | Leaflet 1.9.4 + React-Leaflet 5.x | Interactive map tiles |
| Marker Clustering | Supercluster 8.x + use-supercluster | Performance clustering for many vendor pins |
| Global State | Zustand 5.x | Map center, zoom, user location, selected vendor |
| Server State | TanStack Query 5.x | Data fetching, caching, stale-while-revalidate |
| Query Persistence | `@tanstack/query-sync-storage-persister` | Offline-first: caches vendor data in localStorage |
| Animations | Framer Motion 12.x | Smooth UI transitions & micro-animations |
| 3D / Landing | @react-three/fiber + @react-three/drei | Three.js integration for landing page effects |
| UI Components | Radix UI (Dialog, Radio, Switch, Slider, Label) | Accessible, unstyled primitives |
| Styling | Tailwind CSS 4.x | Utility-first CSS |
| Toast | Sonner 2.x | Notification toasts |
| Drawer/Sheet | Vaul 1.x | Mobile-friendly bottom sheet component |
| WebSockets | socket.io-client 4.8.3 | Connects to backend Socket.io server |
| HTTP Client | Axios 1.x | REST API calls |
| Icons | lucide-react 0.563 | SVG icon set |
| Theming | next-themes 0.4.6 | Dark/Light mode support |

---

## 3. Database Design

### 3.1 MongoDB Collections

#### `vendors` Collection — `Vendor` Model

The core vendor document. Stores both static shop data and mobile hawker data in a single collection, differentiated by `vendorType`.

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Unique user identity (used for socket auth) |
| `email` | String (unique) | Login credential |
| `password` | String | bcrypt-hashed |
| `vendorName` | String | Person's name |
| `shopName` | String | Public shop name shown on map |
| `phoneNumber` | String | Contact number |
| `vendorType` | `'static'` \| `'mobile'` | Determines geo-tracking behavior |
| `shopImage` | String | URL to uploaded shop logo |
| `isOnline` | Boolean | Visibility toggle on the live map |
| `deliveryAvailable` | Boolean | Home delivery capability flag |
| `menu` | Array\<MenuItem\> | Embedded inventory list |
| `location` | GeoJSON Point | GeoJSON `{ type: 'Point', coordinates: [lng, lat] }` |

**Indexes:**
- `location` → `2dsphere` (enables `$near`, `$geoWithin` queries)
- `shopName`, `vendorName`, `menu.productName` → `text` (full-text search)

**MenuItem (embedded schema):**

| Field | Type | Description |
|---|---|---|
| `productName` | String | e.g., "Tomato" |
| `pricePerKg` | Number | Price per kilogram |
| `itemStatus` | `'in-stock'` \| `'out-of-stock'` | Live stock status |
| `image` | String | Product image URL |
| `category` | `'vegetable'` \| `'fruit'` \| `'other'` | Product category |

---

#### `consumers` Collection — `Consumer` Model

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Unique user identity |
| `email` | String (unique) | Login credential |
| `password` | String | bcrypt-hashed (via pre-save middleware hook) |
| `name` | String | Display name |
| `favoriteVendors` | Array\<ObjectId\> | References to saved vendor `_id`s |

---

#### `searchtags` Collection — `SearchTag` Model

A **denormalized search index** — a flat, optimized collection for powering the search feature. Records are automatically kept in sync when vendor inventory or status changes.

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Owning vendor's userId |
| `vendorId` | ObjectId | Ref to vendor `_id` |
| `type` | `'shop'` \| `'item'` | Whether tag is for the whole shop or a single item |
| `displayText` | String | Human-readable label (shop/product name) |
| `slug` | String | Lowercase for regex matching |
| `image` | String | Icon for search results |
| `price` | Number | Item price (filled for `type: 'item'`) |
| `subText` | String | e.g., "from Raju's Vegetables" |
| `isOnline` | Boolean | Mirror of vendor's online status |
| `location` | GeoJSON Point | Mirror of vendor's location |

**Indexes:** `2dsphere` on `location`, text indexes on `displayText`/`slug`, regular index on `isOnline`.

---

#### `bugreports` Collection — `BugReport` Model

| Field | Type | Description |
|---|---|---|
| `title` | String (max 150) | Brief issue title |
| `description` | String (max 5000) | Detailed description |
| `imageUrl` | String | Optional screenshot path |
| `reportedBy` | Object | `{ userId, email, role: 'vendor'|'consumer' }` |
| `status` | `'open'`\|`'in-review'`\|`'resolved'` | Admin triage status |

---

## 4. Backend API Reference

**Base URL:** `https://veggiemap.codewithvin.app/api`

### 4.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/vendor/register` | Public | Register new vendor with location, type, phone |
| POST | `/vendor/login` | Public | Login vendor, returns JWT |
| POST | `/consumer/register` | Public | Register new consumer |
| POST | `/consumer/login` | Public | Login consumer, returns JWT |
| POST | `/admin/login` | Public (secret) | Admin login with env-stored credentials, returns admin-scoped JWT |

**Notes:**
- Email uniqueness is enforced **across both** `Vendor` and `Consumer` collections.
- Vendor registration also checks for duplicate phone numbers.
- JWT tokens expire in **30 days** (vendor/consumer) or **7 days** (admin, separate secret).

---

### 4.2 Vendor Routes (`/api/vendor`) — Auth Required

| Method | Endpoint | Description |
|---|---|---|
| GET | `/menu` | Get authenticated vendor's full menu |
| POST | `/menu` | Add new product (syncs SearchTag) |
| PATCH | `/menu/:itemId` | Update product name/price/status/image (resync SearchTags) |
| DELETE | `/menu/:itemId` | Delete product + image file from disk (resync SearchTags) |
| PATCH | `/toggle-online` | Toggle vendor online/offline (broadcasts via Socket.io + syncs SearchTags) |
| PATCH | `/set-static-loc` | Set fixed location for static vendor (syncs SearchTag location) |
| GET | `/stats` | Get dashboard stats (total/active items) |

**SearchTag Sync Strategy:**
Every mutation (add/edit/delete item, toggle status, change location) triggers a full re-sync of that vendor's SearchTag documents. This ensures the search index always reflects the live state without complex differential updates.

---

### 4.3 Vendor Settings Routes (`/api/vendor/settings`) — Auth Required

Handles vendor profile updates (shop name, shop image, phone number, delivery flag). Kept in a separate router file for clarity.

---

### 4.4 Consumer Routes (`/api/consumer`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/search` | Private | Geo-search vendors by bounding box or radius + optional product/shop query |
| GET | `/search-v2` | Public | High-performance search using `SearchTag` collection with `$geoNear` aggregation |
| POST | `/favorites/:vendorId` | Private | Toggle vendor as favorite (add or remove) |
| GET | `/favorites` | Private | Get consumer's saved vendors (populated) |
| GET | `/vendor/:id` | Public | Get a single vendor's public details by userId or _id |
| PUT | `/profile` | Private | Update consumer's display name |
| POST | `/sync-search` | Internal | Full rebuild of SearchTag index from all vendors |

**Search V2 Pipeline:**
1. `$geoNear` on `SearchTag` collection (filters `isOnline: true` within `maxDistance`)
2. Optional regex `$match` on `slug` field
3. `$limit 20`
4. `$project` to return lean result set

---

### 4.5 Upload Routes (`/api/upload`)

Handles multipart file uploads (shop images, product images, bug report screenshots) using Multer. Files are stored under `Backend/uploads/` and served as static assets via Express.

---

### 4.6 Bug Report Routes (`/api/bugs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Submit bug report with optional screenshot |
| GET | `/` | Admin | List all bug reports |
| PATCH | `/:id` | Admin | Update bug report status |

---

## 5. Real-Time Engine (Socket.io)

### 5.1 Overview

The Socket.io server runs on the **same port** as Express (port 5000), using Node's `http.createServer`. Nginx handles WebSocket upgrade headers for the `/socket.io/` path.

### 5.2 Authentication Flow

Every client (vendor or consumer) must **authenticate immediately** after connecting:

```
Client connects → emits 'auth' (JWT token)
  → Server verifies JWT → looks up Vendor or Consumer in MongoDB
  → Server emits 'auth:success' { role } or 'auth:failure'
  → On failure: socket.disconnect(true)
```

The server maintains an in-memory `activeClients` map:
```js
activeClients[socket.id] = { userId, role, vendorType, socket }
```

### 5.3 Geo-Room Partitioning (Scalability)

To prevent broadcasting every location update to every connected user, the world is divided into 1×1 degree grids (~111km × 111km cells).

**Room naming:** `geo-${Math.trunc(lat)}-${Math.trunc(lng)}`  
Example: Lat 28.6, Lng 77.2 → `geo-28-77`

- **Consumers** emit `consumer:join-room { lat, lng, previousRoom }` when they move the map. The server makes them leave the old room and join the new one.
- **Mobile vendors** do NOT join rooms; they broadcast INTO the room matching their current GPS coordinates.

### 5.4 Socket Events Reference

| Event | Direction | Description |
|---|---|---|
| `auth` | Client → Server | JWT token for authentication |
| `auth:success` | Server → Client | Role assigned |
| `auth:failure` | Server → Client | Auth rejected, socket disconnected |
| `consumer:join-room` | Client → Server | Consumer joins a geo-room based on map center |
| `vendor:location-update` | Client → Server | Mobile vendor pushes GPS coords |
| `vendor:location-move` | Server → Room | Broadcast new vendor coordinates to consumers |
| `vendor:online` | Client → Server | Static vendor signals they are going online |
| `vendor:status-update` | Server → All | Vendor online/offline status change |
| `vendor:removed` | Server → All | Mobile vendor went offline → remove from map |
| `inventory:updated` | Server → Room | Vendor's in-stock items changed |

### 5.5 Debounced DB Writes

Mobile vendors can push location updates very frequently. To prevent MongoDB from being overwhelmed, the server debounces DB writes:

```js
// Only write to MongoDB once every 30 seconds per vendor
if (!client.lastDbUpdate || now - client.lastDbUpdate > 30000) {
    await Vendor.findOneAndUpdate(...)
    client.lastDbUpdate = now;
}
// Socket broadcast happens EVERY update (no throttle)
```

### 5.6 Disconnect Handling — Static vs. Mobile

A key design decision: static and mobile vendors behave differently on socket disconnect.

| Vendor Type | On Disconnect | Reason |
|---|---|---|
| **Mobile** | Marked `isOnline: false`, `vendor:removed` emitted | GPS tracking stops when app is closed |
| **Static** | DB `isOnline` left **unchanged**, current DB status re-broadcast | They may have toggled online via dashboard; socket closing is unrelated |

---

## 6. Frontend Architecture

### 6.1 Page Structure (App Router)

```
src/app/
├── page.tsx                    # Landing page (root redirect)
├── layout.tsx                  # Root layout (providers, fonts)
├── providers.tsx               # TanStack Query provider
├── auth/                       # Vendor & Consumer login/signup screens
├── consumer/                   # Consumer dashboard & profile
├── dashboard/                  # Vendor dashboard (inventory, status, settings)
├── map/                        # Consumer map view (core experience)
├── shop/                       # Vendor shop view (public-facing)
├── admin/                      # Admin utilities
└── secret-admin-a7f3k2/        # Hidden admin panel (obfuscated URL)
```

### 6.2 Component Organization

```
src/components/
├── consumer/       # ConsumerCard, FavoritesDrawer, ProfileSheet
├── landing/        # Hero, Features, ThreeJS background scenes
├── map/            # MapContainer, VendorMarkers, ClusterMarkers
├── map-ui/         # SearchBar, FilterPanel, LocationButton
├── sheet/          # Bottom sheets (vendor details, search results)
├── theme/          # ThemeToggle (dark/light mode)
├── ui/             # Base primitives (Button, Dialog, Input, Badge...)
└── vendor/         # VendorCard, InventoryList, StatusToggle
```

### 6.3 State Management

**Zustand** handles ephemeral client-side state:
- Current map center coordinates
- Map zoom level  
- User's device GPS location
- Currently selected vendor (to open bottom sheet)

**TanStack Query** handles all server data:
- Vendor list for current map bounds (auto-refetch on map move)
- Consumer's favorites list
- Vendor dashboard inventory
- Search results

**TanStack Query Persistence** (`@tanstack/query-sync-storage-persister`): Serializes query cache to `localStorage`, enabling offline-first behavior — the map and last-known vendors load instantly even on slow/no networks.

### 6.4 Map System

- **Leaflet** renders OpenStreetMap tiles in an interactive map.
- **React-Leaflet** provides React bindings for the map.
- **Supercluster** groups nearby vendor markers into clusters at low zoom levels, preventing performance issues when hundreds of vendors are visible.
- **Custom Icons:** Static shops use a vegetable/store icon; mobile hawkers use a rickshaw/cart icon. Different colors/states for Online vs. Offline vendors.
- **Animate on Move:** When a mobile vendor's `vendor:location-move` event is received, the Leaflet marker smoothly animates to the new coordinate.

### 6.5 Socket Context (`SocketContext.tsx`)

A React Context initialized once at app load that:
1. Connects to the Socket.io server
2. Authenticates with the stored JWT
3. Joins the appropriate geo-room
4. Listens for `vendor:location-move`, `vendor:status-update`, `vendor:removed`, `inventory:updated`
5. Updates Zustand/TanStack Query state on each event

---

## 7. Security Implementation

| Concern | Implementation |
|---|---|
| Password Storage | bcryptjs with salt rounds = 10 |
| API Auth | JWT Bearer token in `Authorization` header, validated by `protect` middleware |
| Role Enforcement | `vendorOnly` middleware — checks for vendor role after `protect` |
| Admin Auth | Separate JWT secret (`ADMIN_JWT_SECRET`) and separate credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) from `.env` |
| Admin URL | Obfuscated path: `/secret-admin-a7f3k2` |
| CORS | Strict whitelist: only `https://veggiemap.codewithvin.app` and `localhost` |
| File Uploads | Multer restricts file type and size; files served as static with path isolation |
| Security Headers | Nginx injects `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` |
| HTTPS | Let's Encrypt SSL/TLS certificate, HTTP → HTTPS redirect via Nginx |
| Cross-Collection Email Check | Registration checks email against both `Vendor` and `Consumer` collections |

---

## 8. Production Deployment

### 8.1 Infrastructure

| Layer | Technology | Detail |
|---|---|---|
| Cloud Provider | AWS EC2 | Ubuntu 22.04 LTS |
| Process Manager | PM2 | Auto-restart, log rotation, startup script |
| Reverse Proxy | Nginx | Handles HTTPS, WebSocket upgrade, static caching |
| SSL | Let's Encrypt / Certbot | Auto-renewed certificate |
| Database | MongoDB Atlas | Cloud-managed, geo-indexed |
| Domain | `codewithvin.app` | Custom domain, DNS points to EC2 Elastic IP |

### 8.2 PM2 Process Configuration (`ecosystem.config.js`)

Two processes managed by PM2:

| Process Name | CWD | Script | Port |
|---|---|---|---|
| `veggiemap-backend` | `./Backend` | `server.js` | 5000 |
| `veggiemap-frontend` | `./client` | `next start` | 3000 |

Both use `exec_mode: 'fork'` (single instance, required for Socket.io stateful connections). Logs are written to `./logs/` with timestamps.

### 8.3 Nginx Configuration (`veggiemap.conf`)

Four proxy blocks in the HTTPS server:

| Location | Proxies To | Special Config |
|---|---|---|
| `/socket.io/` | `:5000` | WebSocket upgrade headers, 86400s timeout |
| `/api/` | `:5000` | No buffering (`proxy_buffering off`) |
| `/uploads/` | `:5000` | 7-day cache headers (`Cache-Control: immutable`) |
| `/` (catch-all) | `:3000` | Next.js frontend |

HTTP (port 80) is an unconditional 301 redirect to HTTPS.

`client_max_body_size 10M` allows image uploads up to 10MB.

### 8.4 Deployment Script (`deploy.sh`)

An 8-step automated shell script that runs on the EC2 instance:

1. Install system dependencies (nginx, certbot, Node.js 20, PM2)
2. `npm install --omit=dev` for Backend
3. `npm install` for client
4. `npm run build` for Next.js (production build)
5. Copy and link Nginx config
6. Obtain Let's Encrypt SSL certificate (non-interactive)
7. `pm2 start ecosystem.config.js` + save + startup
8. Verify with `pm2 status` and Nginx status

### 8.5 Environment Variables

**Backend (`.env`):**
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_JWT_SECRET=...
```

**Frontend (`.env.production`):**
```
NEXT_PUBLIC_API_URL=https://veggiemap.codewithvin.app/api
NEXT_PUBLIC_BACKEND_URL=https://veggiemap.codewithvin.app
NEXT_PUBLIC_SOCKET_URL=https://veggiemap.codewithvin.app
NEXT_PUBLIC_ADMIN_PATH=secret-admin-a7f3k2
```

---

## 9. Key Technical Decisions & Trade-offs

### 9.1 Single Collection for Static + Mobile Vendors
**Decision:** Use one `Vendor` collection with a `vendorType` discriminator field instead of two separate collections.  
**Why:** Simplifies geospatial queries (`$geoNear` works on all vendors at once) and reduces code duplication in API routes.

### 9.2 Denormalized SearchTag Collection
**Decision:** Maintain a separate `SearchTag` collection that mirrors vendor/item data for search.  
**Why:** MongoDB's `$text` index and `$geoNear` cannot be combined in a single aggregation on the `Vendor` collection. `SearchTag` is a flat structure purpose-built for the `$geoNear → $match → $limit → $project` pipeline, delivering sub-100ms search results.  
**Trade-off:** Requires a sync strategy on every mutation (re-sync all tags for that vendor on change).

### 9.3 Debounced DB Writes for Mobile Vendors
**Decision:** Write GPS coordinates to MongoDB only every 30 seconds max per vendor, but broadcast via Socket.io on every update.  
**Why:** A moving vendor may emit 1 update/second. Direct MongoDB writes at that rate would be unsustainable. The broadcast frequency is decoupled from the persistence frequency.

### 9.4 Geo-Room Partitioning
**Decision:** 1×1 degree grid rooms (~111km radius).  
**Why:** Prevents a global broadcast to all connected sockets on every location ping. Only consumers in the same geographic cell receive updates relevant to them.  
**Trade-off:** A vendor moving across a grid boundary may temporarily not be visible to consumers in the new cell until the consumer's next `join-room` event.

### 9.5 Static Vendor Disconnect Behavior
**Decision:** Do NOT change `isOnline` for static vendors when their socket disconnects.  
**Why:** Static vendors control their open/closed status via the Dashboard toggle (HTTP PATCH). A socket disconnection (network unstable, browser refresh) should not accidentally mark their shop as closed.

### 9.6 PM2 Fork Mode (No Cluster)
**Decision:** Single instance in fork mode instead of cluster.  
**Why:** Socket.io requires sticky sessions in cluster mode (otherwise, WebSocket upgrade requests may hit a different worker than the initial handshake). For the current scale, a single Node.js process is sufficient.

---

## 10. Feature Status

| Feature | Status | Notes |
|---|---|---|
| Consumer Map with Live Clustering | ✅ Complete | Supercluster, custom icons |
| Vendor Registration & Login | ✅ Complete | Both static & mobile |
| Consumer Registration & Login | ✅ Complete | |
| Admin Login & Panel | ✅ Complete | Obfuscated URL, separate JWT |
| Real-Time Mobile Vendor Tracking | ✅ Complete | GPS → Socket.io → Leaflet animation |
| Geo-Room Partitioning | ✅ Complete | 1°×1° grid rooms |
| Inventory Management (Dashboard) | ✅ Complete | Add/edit/delete items with images |
| Product Images Upload | ✅ Complete | Multer + static serving |
| Shop Image Upload | ✅ Complete | Per-vendor logo |
| Online/Offline Toggle | ✅ Complete | Real-time broadcast to map |
| Static Vendor Location Setting | ✅ Complete | Map-click to set location |
| Consumer Search (Geo + Text) | ✅ Complete | Bounding box or radial + regex |
| Search V2 (SearchTag Engine) | ✅ Complete | `$geoNear` aggregation pipeline |
| Favorites (Save Vendors) | ✅ Complete | Toggle & view saved vendors |
| Consumer Profile Update | ✅ Complete | Name update |
| Dark/Light Mode | ✅ Complete | next-themes |
| Bug Reporting System | ✅ Complete | With screenshot upload + admin triage |
| HTTPS / SSL | ✅ Complete | Let's Encrypt |
| Production EC2 Deployment | ✅ Complete | Live at veggiemap.codewithvin.app |
| PWA / Offline Support | ⚠️ Partial | TanStack Query persistence active; no service worker |
| Push Notifications | ❌ Not Started | Planned for future |
| Payment Integration (UPI) | ❌ Not Started | Planned for future |
| Ratings & Reviews | ❌ Not Started | Planned for future |
| Vendor KYC Verification | ❌ Not Started | Planned for future |
| Native Mobile App | ❌ Not Started | Planned (React Native / Flutter) |

---

## 11. Performance Optimizations

| Optimization | Where | Impact |
|---|---|---|
| MongoDB `2dsphere` Index | `Vendor`, `SearchTag` | O(log n) geospatial queries instead of full scans |
| Supercluster Marker Clustering | Frontend Map | Renders clusters instead of thousands of pins |
| Debounced DB Writes (30s) | Socket.io location handler | Prevents MongoDB write overload |
| Geo-Room Partitioning | Socket.io | Limits broadcast fan-out to relevant area |
| TanStack Query Caching | Frontend | Eliminates redundant API calls on navigation |
| TanStack Query Persistence | Frontend | Instant map load from localStorage on revisit |
| Nginx Gzip Compression | Nginx | Reduces payload size for text/JSON/JS/CSS |
| Static File Caching (7 days) | Nginx `/uploads/` | Eliminates repeated fetch of vendor images |
| Next.js Production Build | Frontend | Static optimization, code splitting, tree shaking |
| SearchTag Denormalization | Search V2 | Purpose-built flat structure avoids expensive joins |

---

## 12. Future Roadmap

### Phase 2 — Mobile App (React Native / Flutter)
- **Background GPS Tracking:** True background location service (not throttled by browser)
- **Battery Optimization:** Reduce polling frequency when vendor is stationary
- **Route Analytics:** Heatmaps of high-sales areas
- **Digital Bell:** Push notification when a favorite vendor enters the street

### Phase 3 — Marketplace Features
- **UPI Payment Integration:** PhonePe / Razorpay for direct vendor payments
- **Ratings & Reviews:** Trust building for vendors
- **Vendor KYC:** Admin-verified Aadhaar/FSSAI documents
- **Order History:** Track past purchases

### Phase 4 — Scale & Reliability
- **Redis for Socket.io Adapter:** Enable PM2 cluster mode for horizontal scaling
- **S3 / CDN for Uploads:** Offload file storage from EC2 instance disk
- **Full PWA with Service Worker:** Complete offline support
- **Monitoring:** Sentry for error tracking, Grafana for metrics

---

## 13. Project Links

| Resource | URL |
|---|---|
| Live Application | https://veggiemap.codewithvin.app |
| Admin Panel | https://veggiemap.codewithvin.app/secret-admin-a7f3k2 |
| API Health Check | https://veggiemap.codewithvin.app/api/ |
| GitHub Repository | `vinay-vk-kumar/veggiemap-dev` |

---

*Report generated: March 2026 — Reflects production deployment v1.0.*
