# Airbnb Clone – Full Stack Application

A pixel-perfect Airbnb clone built with **Django REST Framework** (backend) and **Next.js 14 App Router** (frontend).

## Architecture

```
AirbnbClone/
├── backend/          # Django REST API
│   ├── api/          # Main app (models, views, serializers)
│   │   └── management/commands/seed_data.py
│   ├── core/         # Django project config (settings, urls)
│   ├── media/        # Uploaded listing images (tracked in git)
│   ├── db.sqlite3    # SQLite database (tracked in git)
│   ├── manage.py
│   ├── requirements.txt
│   └── venv/         # Python virtual environment (NOT in git)
│
└── frontend/         # Next.js 14 App Router
    ├── src/
    │   ├── app/      # Pages (/, /listings/[id], /host, /host/create)
    │   ├── components/  # Navbar, ListingCard, etc.
    │   └── providers/   # AuthProvider (mock auth)
    └── package.json
```

## Quick Start

### Backend Setup

```bash
cd backend

# Create and activate the virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed the database with sample listings and images
python manage.py seed_data

# Start the backend server
python manage.py runserver
```

The backend runs at **http://127.0.0.1:8000**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend runs at **http://localhost:3000**

## Environment Variables

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Seed Data

The `seed_data` management command:
- Clears existing non-superuser data
- Creates **2 users**: `sarah_host` (is_host=True) and `alex_guest`
- Creates **6 diverse listings**: Malibu villa, Aspen cabin, NYC loft, Tuscan farmhouse, Maldives bungalow, Tokyo studio
- Generates **3 PIL placeholder images** per listing in `media/listings/`

```bash
python manage.py seed_data
```

Credentials:
- **Host:** `sarah_host` / `host1234`
- **Guest:** `alex_guest` / `guest1234`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings/` | List all listings |
| POST | `/api/listings/` | Create listing (multipart/form-data) |
| GET | `/api/listings/{id}/` | Get listing detail |
| GET | `/api/listings/{id}/booked-dates/` | Get booked date ranges |
| POST | `/api/listings/{id}/add-images/` | Add images to listing |
| GET | `/api/bookings/` | List bookings |
| POST | `/api/bookings/` | Create booking |
| GET | `/api/users/` | List users |
| GET | `/media/listings/{filename}` | Serve uploaded images |

## Key Design Decisions

- **Media tracking**: `db.sqlite3` and `media/` are NOT gitignored so seeded data persists on Render
- **Mock auth**: Frontend uses a hardcoded `userId: 1` context with a toggleable `host`/`guest` role
- **Image fallback**: All listing cards show a gray placeholder if no image is available
- **Booking overlap validation**: The API rejects bookings where dates conflict with existing confirmed bookings
- **FormData uploads**: The Create Listing form sends `multipart/form-data` for proper image uploads

## Deploying to Render

1. Push entire repo including `db.sqlite3` and `media/`
2. Set `DEBUG=False` and configure `ALLOWED_HOSTS` in production settings
3. Backend: `pip install -r requirements.txt && python manage.py migrate`
4. Frontend: `npm install && npm run build`
