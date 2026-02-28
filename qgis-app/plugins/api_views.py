# coding=utf-8
"""
DRF API views for the plugins application.
Provides read-only REST API endpoints consumed by the React frontend.
"""

from django.db.models.functions import Lower
from rest_framework import filters, generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from plugins.models import Plugin
from plugins.serializers import PluginDetailSerializer, PluginSerializer


class PluginPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PluginListView(generics.ListAPIView):
    """
    List all approved plugins with optional filtering and search.

    Query parameters:
    - `search`: filter by name, description or author
    - `tag`: filter by tag name
    - `sort`: field to sort by (name, downloads, created_on)
    - `order`: sort order (asc, desc)
    - `page_size`: number of results per page (default 20, max 100)
    """

    serializer_class = PluginSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = PluginPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description", "author"]

    SORTABLE_FIELDS = {
        "name": "name",
        "downloads": "downloads",
        "created_on": "created_on",
        "latest_version_date": "latest_version_date",
    }

    def get_queryset(self):
        qs = Plugin.approved_objects.all()

        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__name=tag)

        sort = self.request.query_params.get("sort", "name")
        order = self.request.query_params.get("order", "asc")
        field = self.SORTABLE_FIELDS.get(sort)
        if field is not None:
            if field == "name":
                sort_expr = Lower("name") if order == "asc" else Lower("name").desc()
            else:
                sort_expr = field if order == "asc" else f"-{field}"
            qs = qs.order_by(sort_expr)
        else:
            qs = qs.order_by(Lower("name"))

        return qs.distinct()


class PluginDetailView(generics.RetrieveAPIView):
    """Retrieve a single plugin by its package_name."""

    serializer_class = PluginDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "package_name"
    queryset = Plugin.approved_objects.all()


class ApiStatusView(APIView):
    """Health-check endpoint that returns API version info."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "version": "1",
                "endpoints": {
                    "plugins": request.build_absolute_uri("/api/v1/plugins/"),
                    "token_obtain": request.build_absolute_uri(
                        "/api/v1/auth/token/"
                    ),
                    "token_refresh": request.build_absolute_uri(
                        "/api/v1/auth/token/refresh/"
                    ),
                    "token_verify": request.build_absolute_uri(
                        "/api/v1/auth/token/verify/"
                    ),
                },
            }
        )
