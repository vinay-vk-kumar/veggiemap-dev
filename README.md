# VeggieMap

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tech Stack](https://img.shields.io/badge/tech--stack-MERN--Stack-blue)

VeggieMap synchronizes localized commerce by bridging the visibility gap between mobile street vendors and nearby consumers. Historically, fresh produce vendors rely heavily on foot traffic and routine schedules, while consumers are forced to guess when local carts will arrive in their neighborhood. This disconnect results in lost sales for vendors and inconvenience for consumers.

To solve this, VeggieMap provides a real-time, hyperlocal tracking platform. It leverages an interactive, high-performance map interface that broadcasts the live GPS coordinates and inventory status of mobile vendors directly to local buyers. By enforcing a hard **5km (5000m)** geospatial rendering limit for consumers and pushing instantaneous WebSocket updates, the platform guarantees that buyers only see immediately actionable data. The frontend locally optimizes client-side timers on a consistent **60,000ms (60s)** polling cycle where needed, preserving server bandwidth while ensuring that active location shifts are dispatched seamlessly with zero-latency Socket.io event propagation.

## System Architecture

```mermaid
graph TD
    Client[Web Consumer/Vendor Client] -->|HTTPS| Frontend[Next.js App]
    Frontend -->|REST APIs| Backend[Node/Express Server]
    Client <-->|WebSocket w/ Socket.io| Backend
    Backend -->|Mongoose ODM| Database[(MongoDB Atlas)]
    Backend -->|Image Hosting| CD[(Cloudinary)]
```

## Directory Structure

```text
veggiemap-dev-main/
├── Backend/
│   ├── controllers/      # Route controllers (Auth, Consumer, Vendor, Admin)
│   ├── middleware/       # JWT auth, error handling routines
│   ├── models/           # Mongoose schemas (Vendor, Consumer, SearchTag)
│   ├── routes/           # Express API route declarations
│   └── server.js         # Entry point, Socket.io setup, and Express config
│
│
└── client/
    ├── src/
    │   ├── app/          # Next.js App Router pages and layouts
    │   ├── components/   # Reusable React components (Map, UI blocks)
    │   ├── lib/          # Utility functions, API interceptors
    │   └── hooks/        # Custom React hooks (e.g., useSocket, useGeolocation)
    ├── public/           # Static assets
    └── next.config.ts    # Next.js build and environment configuration
```

## API & Data Flow

The core of VeggieMap is its real-time location streaming. When a mobile vendor goes online, their browser's Geolocation API tracks them (`enableHighAccuracy: true`). 

1. **Emission:** The vendor's client emits a `vendor:location-update` Socket.io event containing `lat` and `lng`.
2. **Throttling:** The backend receives the ping. It checks the in-memory `lastDbUpdate` timestamp. If less than **30 seconds (30000ms)** have passed, the database update is skipped to prevent database choking. If more than 30 seconds have passed, it writes the coordinate to MongoDB.
3. **Geo-Fencing:** The backend calculates a truncated 1-degree coordinate grid name (e.g., `geo-28-77`). 
4. **Broadcasting:** The backend emits the `vendor:location-move` event strictly to consumers subscribed to that specific `geo-28-77` room. 

```mermaid
sequenceDiagram
    participant Mobile Vendor
    participant Socket.io Server
    participant MongoDB Atlas
    participant Consumer Map

    Mobile Vendor->>Socket.io Server: Emit 'vendor:location-update' (lat, lng)
    
    alt 30s elapsed since last write?
        Socket.io Server->>MongoDB Atlas: Vendor.findOneAndUpdate()
        MongoDB Atlas-->>Socket.io Server: Write Acknowledged
    else < 30s elapsed
        Note over Socket.io Server: DB Write Skipped (Debounced)
    end
    
    Socket.io Server->>Socket.io Server: Calculate Geo-Room (e.g., 'geo-28-77')
    Socket.io Server->>Consumer Map: Broadcast 'vendor:location-move' to Room
    Consumer Map->>Consumer Map: Animate Marker (1.5s cubic-bezier transition)
```

### Core REST API Reference

| Method | Endpoint                      | Description                                                                 |
| :----- | :---------------------------- | :-------------------------------------------------------------------------- |
| `POST` | `/api/auth/consumer/register` | Registers a new consumer and issues an HTTP-only JWT.                       |
| `POST` | `/api/auth/vendor/login`      | Authenticates a vendor and returns profile/token payload.                   |
| `GET`  | `/api/consumer/search`        | Performs a `$near` geospatial lookup, capped natively to a 5,000m radius.   |
| `PUT`  | `/api/vendor/inventory`       | Upserts stock definitions and triggers a Cloudinary image sync if required. |

### Core WebSocket Events

| Event Name               | Direction        | Payload Description                                                                  |
| :----------------------- | :--------------- | :----------------------------------------------------------------------------------- |
| `vendor:location-update` | Client -> Server | Emits continuous `lat`/`lng` polling coordinates from a vendor device.               |
| `consumer:join-room`     | Client -> Server | Connects the consumer to a geospatial grid room based on their viewport.             |
| `vendor:location-move`   | Server -> Client | Broadcasts localized movement updates to all consumers in the geospatial room.       |
| `inventory:updated`      | Server -> Client | Pushes instantaneous pricing and stock availability mutations to active map clients. |

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion (for DOM layout animation and 3D scrolling transforms)
- **Backend**: Node.js, Express.js, Socket.io (for persistent, room-based event broadcasting)
- **Auth & Security**: User authorization leverages JSON Web Tokens (hard-capped to exactly **30d** expiration), paired with industry-standard generic `bcrypt` utilizing precisely **10 salt rounds** for password encryption.
- **Database**: MongoDB Atlas (Leveraging native `2dsphere` indexes and optimized `$near` geospacial pipelines)
- **Storage**: Cloudinary (Off-server image CDN and on-the-fly transformations)

## Screens & User Interface

![Hero Section Map UI](./Consumer%20Dashboard.png)
_The consumer map UI showing hovering vendor carts_

## Environment Variables

### Backend (`Backend/.env`)

| Variable                | Description                                  | Example Value                           |
| :---------------------- | :------------------------------------------- | :-------------------------------------- |
| `MONGO_URI`             | MongoDB Atlas Connection String              | `mongodb+srv://user:pass@cluster0...`   |
| `JWT_SECRET`            | Secret key for signing consumer/vendor JWTs. | `super_secret_jwt_key`                  |
| `ADMIN_JWT_SECRET`      | Dedicated secret key for Admin panel access. | `super_secret_admin_key`                |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account identifier.               | `dbxmyxyz`                              |
| `CLOUDINARY_API_KEY`    | Cloudinary REST API Key.                     | `983719237412`                          |
| `CLOUDINARY_API_SECRET` | Cloudinary REST Secret.                      | `ABC123xyz_def_GHI`                     |
| `ALLOWED_ORIGINS`       | Comma-separated list for CORS validation.    | `http://localhost:3000,https://app.com` |

### Frontend (`client/.env.local` / `.env.production`)

| Variable                  | Description                                 | Example Value               |
| :------------------------ | :------------------------------------------ | :-------------------------- |
| `NEXT_PUBLIC_API_URL`     | Base URL for Express REST routing.          | `http://localhost:5000/api` |
| `NEXT_PUBLIC_SOCKET_URL`  | Base domain for `socket.io-client` binding. | `http://localhost:5000`     |
| `NEXT_PUBLIC_BACKEND_URL` | Optional base origin config.                | `http://localhost:5000`     |
| `NEXT_PUBLIC_ADMIN_PATH`  | Hashed or hidden route for Admin dashboard. | `/hidden-admin-panel`       |

## Prerequisites

- Node.js v18+
- A MongoDB Atlas Account (or local MongoDB instance)
- Git

## Quick Start / Installation

We use Docker to orchestrate the frontend and backend services easily. MongoDB Atlas and Cloudinary are strictly cloud-based and do not run in containers.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/veggiemap-dev-main.git
cd veggiemap-dev-main

# 2. Configure Environment Variables
# Copy the example templates and fill in your real credentials (especially MongoDB URI and Cloudinary keys)
cp Backend/.env.example Backend/.env
cp client/.env.local.example client/.env.local

# 3. Build and Start the Stack
# This will build the Node.js backend and Next.js frontend, then spin them up.
docker compose up --build -d

# The backend will be available at http://localhost:5000
# The frontend will be available at http://localhost:3000
```

## Key Features

- **Real-time Geospatial Tracking:** WebSockets broadcast vendor locations natively using in-memory Socket maps.
- **Aggressive Query Pagination:** To guarantee O(1) performance and stable client rendering, the backend geospatial pipelines are hard-capped to aggregate only exactly **20** nearest tags at once.
- **Hyperlocal Discovery:** Hard limit constraints lock geospatial `$near` lookups to exactly 5,000 meters.
- **Database Protection:** Server-side debouncing limits MongoDB upserts to **1 write per 30,000ms** per connection.
- **Transparent Pricing:** Inventory synchronization pushes live price tags directly to the consumer map.
- **Advanced Landing UI:** Heavily optimized DOM structure using Framer Motion for scroll-linked 3D physics.

## Deployment / Hosting

- **Frontend:** Optimized natively for zero-config deployment on Vercel or Netlify.
- **Backend:** Express & Socket.io architecture can be easily containerized via Docker and deployed on platforms like Render, Railway, AWS EC2, or DigitalOcean Droplets. The only requirement for the backend is ensuring the port binds properly and Socket.io origin constraints are handled. Ensure MongoDB Atlas IP Network Access is whitelisted (`0.0.0.0/0`) if deploying to non-static IP cloud platforms.

## Relevant Future Scope / Optimizations

1. **Client-Side Spatial Throttling:** Currently, the vendor's device relies on `navigator.geolocation` defaults to emit WebSockets. Implementing a client-side Haversine check to only emit a socket event if the vendor has moved >15 meters will drastically reduce network chatter on the backend.
2. **Asymmetric Connection Protocols:** While vendors require WebSockets to broadcast data, consumers are primarily passive readers. Migrating consumers from WebSockets to Server-Sent Events (SSE) will drastically reduce the TCP connection overhead and memory footprint on the Node.js server.
3. **In-Memory Geohashing Cache:** To scale beyond the current database capacity, replace the `$geoNear` query with an in-memory Geohash `Map` lookup in Node.js. By stringifying coordinates (e.g., `tdr1v`), consumer queries become $O(1)$ dictionary lookups rather than mathematical database computations.