# QGIS Plugins Website – Development & Production Guide

This document describes how to run the QGIS Plugins Website in both **development** and **production** environments using Docker Compose.

---

## Architecture Overview

| Layer | Technology |
|-------|-----------|
| Web framework | Django 4.2 |
| REST API | Django Rest Framework (DRF) 3.14 + `djangorestframework-simplejwt` |
| Frontend | ReactJS 18 (Webpack 5 / Babel 7) + Bulma CSS |
| Database | PostgreSQL 16 + PostGIS |
| Task queue | Celery + RabbitMQ |
| Web server | Nginx (prod) / Django dev server (dev) |

The REST API lives under `/api/v1/` and is documented via Swagger at `/api/v1/docs/swagger/`.  
React components are compiled by Webpack and embedded in Django templates via `django-webpack-loader`.

---

## Quick-start: Development Environment

### Prerequisites
- Docker ≥ 24  
- Docker Compose ≥ 2.20  
- `make`

### 1. Clone and configure

```bash
git clone https://github.com/Xpirix/QGIS-Plugins-Website.git
cd QGIS-Plugins-Website/dockerize
cp .env.template .env
# Edit .env if you need to override defaults
```

### 2. Build and start

```bash
make build-dev   # Build the development Docker image
make devweb      # Start devweb + db + rabbitmq + worker + beat + webpack
```

This starts:
- `devweb` – Django development server on **http://localhost:62202**
- `webpack` – Webpack watch mode (React + CSS hot-rebuild)
- `db` – PostgreSQL
- `rabbitmq` – message broker
- `worker` / `beat` – Celery

### 3. Run migrations and seed fixtures

```bash
make devweb-migrate
make dbseed        # optional: loads sample fixtures
```

### 4. Create a superuser

```bash
make devweb-exec c="python manage.py createsuperuser"
```

### 5. Access the site

| URL | Description |
|-----|-------------|
| http://localhost:62202/ | Main website |
| http://localhost:62202/api/v1/ | REST API status |
| http://localhost:62202/api/v1/plugins/ | Plugin list (JSON) |
| http://localhost:62202/api/v1/docs/swagger/ | Interactive API docs |
| http://localhost:62202/admin/ | Django admin |

### 6. React hot-reload

Webpack runs in watch mode inside the `webpack` container and rebuilds bundles automatically whenever you edit files under `qgis-app/static/js/react/`.  
Refresh the browser to see your changes.

---

## REST API Authentication

The project uses **JWT (JSON Web Tokens)** via `djangorestframework-simplejwt`.

### Obtain tokens

```bash
curl -X POST http://localhost:62202/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_user", "password": "your_password"}'
```

Response:
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```

### Use the access token

```bash
curl http://localhost:62202/api/v1/plugins/ \
  -H "Authorization: Bearer <access_token>"
```

### Refresh the access token

```bash
curl -X POST http://localhost:62202/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

### Plugin-specific CI/CD tokens

For automated plugin uploads (CI/CD), each plugin has its own long-lived token.  
Generate one through the web UI at `/plugins/<package_name>/tokens/`.

---

## Production Environment

### 1. Configure the environment

```bash
cd dockerize
cp .env.template .env
# Set production values:
#   DATABASE_PASSWORD, SECRET_KEY, VIRTUAL_HOST, DOMAIN_NAME, etc.
nano .env
```

### 2. Build production images

```bash
make build
```

### 3. Start all services

```bash
make run
```

This runs `migrate`, `collectstatic`, and starts `uwsgi`, `web` (Nginx), `worker`, `beat`, etc.

### 4. SSL (Let's Encrypt)

```bash
make certbot   # Obtain / renew Let's Encrypt certificate
```

### Useful production commands

| Command | Description |
|---------|-------------|
| `make migrate` | Apply pending database migrations |
| `make collectstatic` | Collect static files |
| `make uwsgi-shell` | Shell inside the `uwsgi` container |
| `make uwsgi-logs` | Tail request logs |
| `make uwsgi-errors` | Tail error logs |
| `make web-logs` | Tail Nginx logs |
| `make dbrestore` | Restore database from backup |

---

## Running Tests

Tests are run inside Docker against a test database:

```bash
make devweb-test   # Start the test container

# Then inside the container:
make devweb-exec c="python manage.py test plugins"
```

Or run a specific test module:

```bash
make devweb-exec c="python manage.py test plugins.tests.test_token_auth"
```

---

## React Frontend Development

The React application lives in `qgis-app/static/js/react/`.

| File / Folder | Purpose |
|---------------|---------|
| `static/js/react/index.jsx` | Entry point – mounts components into Django pages |
| `static/js/react/components/` | Reusable React components |
| `static/js/react/hooks/` | Custom React hooks (e.g. `usePlugins` for DRF calls) |
| `babel.config.json` | Babel presets for JSX + modern JS |
| `webpack.config.js` | Two entry points: `main` (legacy) and `app` (React) |

### Embedding React in a Django template

Add a container element and include the `app` bundle:

```html
{% load render_bundle from webpack_loader %}
{% render_bundle 'app' %}

<!-- React will mount here -->
<div id="react-plugin-list"></div>
```

The available mount points are:

| `id` | Component |
|------|-----------|
| `react-plugin-list` | `PluginList` – full paginated list with search |
| `react-plugin-search` | `PluginSearch` – live search dropdown |

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_NAME` | `gis` | PostgreSQL database name |
| `DATABASE_USERNAME` | `docker` | PostgreSQL user |
| `DATABASE_PASSWORD` | `docker` | PostgreSQL password |
| `DATABASE_HOST` | `db` | PostgreSQL host |
| `DEBUG` | `True` | Django debug mode |
| `RABBITMQ_HOST` | `rabbitmq` | Celery broker host |
| `VIRTUAL_HOST` | `plugins.kartoza.com` | Nginx virtual host |
| `DOMAIN_NAME` | `plugins.qgis.org` | Let's Encrypt domain |
| `DEFAULT_FROM_EMAIL` | `no-reply-plugins@qgis.org` | Sender email |
| `SENTRY_DSN` | *(empty)* | Sentry error tracking DSN |
