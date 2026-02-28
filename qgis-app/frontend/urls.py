from django.urls import path, re_path

from .views import FrontendView

# Catch-all: serve the React SPA for any URL not matched by earlier patterns.
# Django admin, API, XML feeds and download endpoints are defined
# before this in the main urls.py and therefore take priority.
urlpatterns = [
    # Explicit front-end entry points help Django reverse-resolve
    # names used in templates / emails.
    path("", FrontendView.as_view(), name="frontend"),
    re_path(r"^(?P<path>.+)$", FrontendView.as_view(), name="frontend_catchall"),
]
