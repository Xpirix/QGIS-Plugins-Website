# Development Guide – QGIS Plugins Website

This guide explains how to run the project in development and production
using the Docker Compose stack, and how to work with the new
**Django REST Framework + React TypeScript** frontend.

---

## Architecture overview

| Layer | Technology | Location |
|-------|-----------|----------|
| Database | PostgreSQL + PostGIS | Docker service `db` |
| Backend API | Django 4.2 + DRF | `qgis-app/` |
| Frontend SPA | React 18 + TypeScript | `qgis-app/frontend/` |
| Task queue | Celery + RabbitMQ | Docker services |
| Bundler | webpack 5 | `qgis-app/frontend/webpack.config.js` |
| Reverse proxy | Nginx | `deployment/` |

The React SPA is built into static bundles by webpack and served via
`django-webpack-loader`. Django serves the SPA shell (`app.html`) for
every frontend route; React Router handles client-side navigation.

Only the following URLs remain as real Django (non-SPA) views:

| Pattern | Purpose |
|---------|---------|
| `/admin/` | Django admin |
| `/api/v1/` | DRF REST API |
| `/plugins/*.xml` | QGIS XML feed |
| `/plugins/RPC2/` | XML-RPC |
| `/plugins/*/version/*/download/` | Zip file download |
| `/plugins/*/tokens/*` | CI/CD token management |
| `/plugins/api/*/version/*/` | CI/CD token upload API |

Everything else is served by the React SPA.

---

## Prerequisites

- **Docker** ≥ 24  
- **Docker Compose** ≥ 2.20  
- **Node.js** ≥ 18 (for local frontend development only)

---

## Development environment

### 1. Copy environment files

```bash
cp deployment/docker-compose.override.example.yml deployment/docker-compose.override.yml
# Edit as needed (DEBUG, SMTP, etc.)
```

### 2. Build and start services

```bash
cd deployment
docker compose up --build
```

Django is available at **http://localhost** (or port defined in your
override file).

### 3. Run database migrations

```bash
docker compose exec django python manage.py migrate
docker compose exec django python manage.py collectstatic --noinput
docker compose exec django python manage.py createsuperuser
```

### 4. Build the React frontend (inside the container)

```bash
docker compose exec django bash -c "cd /home/web/django_project/frontend && npm ci && npm run build"
```

This writes `webpack-stats.prod.json` and the compiled JS/CSS bundles to
`frontend/bundles/frontend/`. Django serves those files via `STATICFILES_DIRS`.

### 5. (Optional) Live frontend development with hot-reload

In a separate terminal, run webpack's dev server on your **host** machine:

```bash
cd qgis-app/frontend
npm ci
npm run serve
```

The dev server runs on `http://localhost:9000/`. Django must also be
running so the API calls succeed. Update `WEBPACK_LOADER.FRONTEND.STATS_FILE`
to point to `webpack-stats.dev.json` if you want Django to load bundles
from the dev server.

---

## Production environment

### 1. Set environment variables

Create a `.env` file (or export variables):

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_NAME` | `qgis_plugins` | PostgreSQL DB name |
| `DATABASE_USERNAME` | `qgis` | DB user |
| `DATABASE_PASSWORD` | `secret` | DB password |
| `DATABASE_HOST` | `db` | DB host |
| `DEBUG` | `False` | Disable debug mode |
| `SECRET_KEY` | `<long-random-string>` | Django secret key |
| `MEDIA_ROOT` | `/home/web/media/` | Uploaded files |
| `STATIC_ROOT` | `/home/web/static/` | Collected static files |
| `ALLOWED_HOSTS` | `plugins.qgis.org` | Comma-separated hosts |
| `BROKER_URL` | `amqp://rabbitmq:5672` | Celery broker |

### 2. Build and deploy

```bash
cd deployment
docker compose -f docker-compose.yml up -d --build
docker compose exec django python manage.py migrate
docker compose exec django python manage.py collectstatic --noinput
```

The frontend React bundles **must** be built before `collectstatic`:

```bash
docker compose exec django bash -c "cd /home/web/django_project/frontend && npm ci && npm run build"
docker compose exec django python manage.py collectstatic --noinput
```

---

## REST API reference

Base URL: `/api/v1/`

### Authentication

```bash
# Obtain JWT tokens
curl -X POST /api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Response: { "access": "...", "refresh": "..." }

# Use access token
curl /api/v1/plugins/ \
  -H "Authorization: Bearer <access_token>"

# Refresh
curl -X POST /api/v1/auth/token/refresh/ \
  -d '{"refresh": "<refresh_token>"}'
```

### Key endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/` | API status |
| GET | `/api/v1/config/` | App config (user info) |
| GET | `/api/v1/plugins/` | List plugins (paginated) |
| GET | `/api/v1/plugins/?filter=fresh` | New plugins |
| GET | `/api/v1/plugins/?filter=popular` | Popular plugins |
| GET | `/api/v1/plugins/?search=<q>` | Search plugins |
| POST | `/api/v1/plugins/upload/` | Upload plugin (auth required) |
| GET | `/api/v1/plugins/<name>/` | Plugin detail |
| GET | `/api/v1/plugins/<name>/versions/<ver>/` | Version detail |
| POST | `/api/v1/plugins/<name>/versions/<ver>/approve/` | Approve version |
| POST | `/api/v1/plugins/<name>/versions/<ver>/unapprove/` | Unapprove |
| DELETE | `/api/v1/plugins/<name>/versions/<ver>/delete/` | Delete version |
| GET | `/api/v1/tags/` | All tags |
| GET | `/api/v1/user/me/` | Current user (auth required) |
| GET | `/api/v1/user/<username>/` | Public user profile |
| POST | `/api/v1/user/<username>/trust/` | Trust user (staff only) |
| POST | `/api/v1/user/<username>/block/` | Block user (staff only) |

### Swagger UI

Interactive API documentation: **http://localhost/api/v1/docs/swagger/**

---

## Frontend development

The React SPA lives in `qgis-app/frontend/src/`.

### Structure

```
frontend/
  src/
    App.tsx            # React entry point
    routes.tsx         # React Router routes
    index.scss         # Global Bulma CSS + custom styles
    context/
      AuthContext.tsx  # JWT auth state
    utils/
      api.ts           # DRF API client (fetch-based)
    components/
      Navbar/          # Top navigation bar
      Footer/          # Footer
      Layout/          # Page layout wrapper
      PluginCard/      # Plugin list card
      Pagination/      # Pagination controls
    pages/
      Home/            # Landing page
      PluginList/      # Plugin list with filters & search
      PluginDetail/    # Plugin detail & version management
      PluginUpload/    # Upload / new version form
      Login/           # Sign-in page
      UserPlugins/     # "My Plugins" / user profile
      Docs/            # Documentation pages
      NotFound/        # 404 page
  webpack.config.js    # Webpack (TypeScript + Bulma)
  package.json         # Node dependencies
  tsconfig.json        # TypeScript config
  templates/
    base.html          # HTML shell (sets window globals from Django)
    app.html           # Loads React bundles
```

### Adding a new page

1. Create `src/pages/MyPage/index.tsx`.
2. Add a route in `src/routes.tsx`.
3. Add an API endpoint in `plugins/api_views.py` if needed.
4. Rebuild: `npm run build` (or `npm run serve` for hot-reload).

### CSS / Theming

Bulma CSS is imported in `src/index.scss` with QGIS green as the primary
colour. Override Bulma variables in that file to adjust the theme.

---

## Running tests

### Backend (Python)

```bash
docker compose exec django python manage.py test plugins.tests.test_api
```

### Frontend (Jest)

```bash
cd qgis-app/frontend
npm test
```
