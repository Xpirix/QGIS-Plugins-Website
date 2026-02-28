# coding=utf-8
"""
Comprehensive DRF API views for the QGIS Plugins Repository.
All HTML-serving Django views have been migrated to these REST endpoints,
consumed by the React SPA frontend.
"""

from urllib.parse import unquote

from django.contrib.auth.models import Permission, User
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Lower
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from plugins.models import Plugin, PluginVersion
from plugins.serializers import (
    PluginDetailSerializer,
    PluginSerializer,
    PluginVersionDetailSerializer,
    UserProfileSerializer,
)


# ─── Pagination ────────────────────────────────────────────────────────────────


class PluginPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ─── Permission helpers ────────────────────────────────────────────────────────


class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


# ─── App Config ────────────────────────────────────────────────────────────────


class AppConfigView(APIView):
    """Returns runtime configuration for the React SPA."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user
        return Response(
            {
                "user": {
                    "is_authenticated": user.is_authenticated,
                    "username": user.username if user.is_authenticated else "",
                    "is_staff": user.is_staff if user.is_authenticated else False,
                    "first_name": user.first_name if user.is_authenticated else "",
                    "last_name": user.last_name if user.is_authenticated else "",
                },
            }
        )


# ─── API Status ────────────────────────────────────────────────────────────────


class ApiStatusView(APIView):
    """Health-check / discovery endpoint."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "version": "1",
                "endpoints": {
                    "plugins": request.build_absolute_uri("/api/v1/plugins/"),
                    "token_obtain": request.build_absolute_uri("/api/v1/auth/token/"),
                    "token_refresh": request.build_absolute_uri(
                        "/api/v1/auth/token/refresh/"
                    ),
                    "token_verify": request.build_absolute_uri(
                        "/api/v1/auth/token/verify/"
                    ),
                    "docs_swagger": request.build_absolute_uri(
                        "/api/v1/docs/swagger/"
                    ),
                },
            }
        )


# ─── Plugin list filters ───────────────────────────────────────────────────────

PLUGIN_FILTER_MAP = {
    "fresh": "fresh_objects",
    "latest": "latest_objects",
    "popular": "popular_objects",
    "most_downloaded": "most_downloaded_objects",
    "most_voted": "most_voted_objects",
    "best_rated": "best_rated_objects",
    "featured": "featured_objects",
    "stable": "stable_objects",
    "experimental": "experimental_objects",
    "server": "server_objects",
    "deprecated": "deprecated_objects",
    "unapproved": "unapproved_objects",
    "feedback_pending": "feedback_pending_objects",
    "feedback_received": "feedback_received_objects",
    "feedback_completed": "feedback_completed_objects",
}

SORTABLE_FIELDS = {
    "name": "name",
    "downloads": "downloads",
    "created_on": "created_on",
    "latest_version_date": "latest_version_date",
}


class PluginListView(generics.ListAPIView):
    """
    List plugins.  Supports query params:
    - search, filter, tag, username, author, sort, order, page, page_size
    """

    serializer_class = PluginSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = PluginPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description", "author"]

    def get_queryset(self):
        request = self.request
        plugin_filter = request.query_params.get("filter", "")

        staff_only = {
            "unapproved",
            "feedback_pending",
            "feedback_received",
            "feedback_completed",
        }
        if plugin_filter in staff_only and not request.user.is_staff:
            return Plugin.objects.none()

        if plugin_filter == "my":
            if not request.user.is_authenticated:
                return Plugin.objects.none()
            qs = (
                Plugin.objects.filter(created_by=request.user)
                | Plugin.objects.filter(owners=request.user)
            ).distinct()
        elif plugin_filter in PLUGIN_FILTER_MAP:
            qs = getattr(Plugin, PLUGIN_FILTER_MAP[plugin_filter]).all()
        else:
            qs = Plugin.approved_objects.all()

        tag = request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__name=tag)

        username = request.query_params.get("username")
        if username:
            user_obj = get_object_or_404(User, username=username)
            qs = (
                qs.filter(created_by=user_obj) | qs.filter(owners=user_obj)
            ).distinct()

        author = request.query_params.get("author")
        if author:
            qs = qs.filter(author=unquote(author))

        sort = request.query_params.get("sort", "name")
        order = request.query_params.get("order", "asc")
        field = SORTABLE_FIELDS.get(sort)
        if field is not None:
            if field == "name":
                sort_expr = Lower("name") if order == "asc" else Lower("name").desc()
            else:
                sort_expr = field if order == "asc" else f"-{field}"
            qs = qs.order_by(sort_expr)
        elif not qs.ordered:
            qs = qs.order_by(Lower("name"))

        return qs.distinct()


class PluginDetailView(generics.RetrieveAPIView):
    """Retrieve a single plugin by its package_name."""

    serializer_class = PluginDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "package_name"
    queryset = Plugin.approved_objects.all()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class PluginUploadView(APIView):
    """Upload a new plugin or a new version of an existing plugin."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from plugins.forms import PackageUploadForm
        from plugins.views import (
            _main_plugin_update,
            check_plugin_access,
            plugin_notify,
        )
        from plugins.tasks.generate_plugins_xml import generate_plugins_xml

        form = PackageUploadForm(request.POST, request.FILES)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            plugin_data = {
                "name": form.cleaned_data["name"],
                "package_name": form.cleaned_data["package_name"],
                "description": form.cleaned_data["description"],
                "created_by": request.user,
                "author": form.cleaned_data["author"],
                "email": form.cleaned_data["email"],
                "icon": form.cleaned_data.get("icon_file"),
            }

            try:
                plugin = Plugin.objects.get(
                    package_name=plugin_data["package_name"]
                )
                if not check_plugin_access(request.user, plugin):
                    return Response(
                        {"detail": "Permission denied."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                plugin.name = plugin_data["name"]
                plugin.description = plugin_data["description"]
                plugin.author = plugin_data["author"]
                plugin.email = plugin_data["email"]
                is_new = False
            except Plugin.DoesNotExist:
                plugin = Plugin(**plugin_data)
                is_new = True

            if plugin_data["icon"]:
                plugin.icon = plugin_data["icon"]

            plugin.server = form.cleaned_data.get("server", False)
            plugin.save()

            version = PluginVersion(
                plugin=plugin,
                created_by=request.user,
                min_qg_version=form.cleaned_data["qgis_minimum_version"],
                version=form.cleaned_data["version"],
                changelog=form.cleaned_data.get("changelog", ""),
                experimental=form.cleaned_data.get("experimental", False),
                supports_qt6=form.cleaned_data.get("supports_qt6", False),
                package=form.cleaned_data["package"],
                approved=request.user.has_perm("plugins.can_approve"),
            )
            version.save()

            _main_plugin_update(request, plugin, form)

            if is_new:
                plugin_notify(plugin)

            generate_plugins_xml.delay()

            serializer = PluginSerializer(plugin, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class PluginDeleteView(APIView):
    """Soft-delete a plugin (mark for deletion)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, package_name):
        from plugins.views import check_plugin_access

        plugin = get_object_or_404(Plugin, package_name=package_name)
        if not check_plugin_access(request.user, plugin):
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )
        plugin.is_deleted = True
        plugin.deleted_on = timezone.now()
        plugin.save()
        return Response({"detail": "Plugin marked for deletion."})


# ─── Plugin version management ─────────────────────────────────────────────────


class PluginVersionDetailView(generics.RetrieveAPIView):
    """Get a single plugin version."""

    serializer_class = PluginVersionDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        return get_object_or_404(
            PluginVersion,
            plugin__package_name=self.kwargs["package_name"],
            version=self.kwargs["version"],
        )


class PluginVersionApproveView(APIView):
    """Approve a plugin version."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, package_name, version):
        from plugins.views import check_plugin_version_approval_rights
        from plugins.tasks.generate_plugins_xml import generate_plugins_xml

        plugin = get_object_or_404(Plugin, package_name=package_name)
        ver = get_object_or_404(PluginVersion, plugin=plugin, version=version)

        if not check_plugin_version_approval_rights(request.user, plugin):
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ver.approved = True
        ver.save()
        generate_plugins_xml.delay()
        return Response(
            PluginVersionDetailSerializer(ver, context={"request": request}).data
        )


class PluginVersionUnapproveView(APIView):
    """Unapprove a plugin version."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, package_name, version):
        from plugins.views import check_plugin_version_approval_rights
        from plugins.tasks.generate_plugins_xml import generate_plugins_xml

        plugin = get_object_or_404(Plugin, package_name=package_name)
        ver = get_object_or_404(PluginVersion, plugin=plugin, version=version)

        if not check_plugin_version_approval_rights(request.user, plugin):
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ver.approved = False
        ver.save()
        generate_plugins_xml.delay()
        return Response(
            PluginVersionDetailSerializer(ver, context={"request": request}).data
        )


class PluginVersionDeleteView(generics.DestroyAPIView):
    """Delete a specific plugin version."""

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            PluginVersion,
            plugin__package_name=self.kwargs["package_name"],
            version=self.kwargs["version"],
        )

    def perform_destroy(self, instance):
        from plugins.views import check_plugin_access
        from plugins.tasks.generate_plugins_xml import generate_plugins_xml
        from rest_framework.exceptions import PermissionDenied

        if not check_plugin_access(self.request.user, instance.plugin):
            raise PermissionDenied("Permission denied.")
        instance.delete()
        generate_plugins_xml.delay()


# ─── Tags ──────────────────────────────────────────────────────────────────────


class TagListView(APIView):
    """Return all tags used by approved plugins."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Count
        from taggit.models import Tag

        tags = (
            Tag.objects.filter(
                taggit_taggeditem_items__content_type__app_label="plugins",
            )
            .annotate(num_times=Count("id"))
            .values("name", "slug", "num_times")
            .distinct()
            .order_by("name")
        )
        return Response(list(tags))


# ─── User API ──────────────────────────────────────────────────────────────────


class UserProfileView(APIView):
    """Return the current authenticated user's profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            UserProfileSerializer(request.user, context={"request": request}).data
        )


class UserDetailView(APIView):
    """Return a specific user's public profile."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        return Response(
            UserProfileSerializer(user, context={"request": request}).data
        )


class UserTrustView(APIView):
    """Grant can_approve permission to a user (staff only)."""

    permission_classes = [IsStaff]

    def post(self, request, username):
        from plugins.views import user_trust_notify

        user = get_object_or_404(User, username=username)
        user.user_permissions.add(
            Permission.objects.get(
                codename="can_approve",
                content_type=ContentType.objects.get(
                    app_label="plugins", model="plugin"
                ),
            )
        )
        user_trust_notify(user)
        return Response(
            UserProfileSerializer(user, context={"request": request}).data
        )


class UserUntrustView(APIView):
    """Revoke can_approve permission from a user (staff only)."""

    permission_classes = [IsStaff]

    def post(self, request, username):
        from plugins.views import user_trust_notify

        user = get_object_or_404(User, username=username)
        user.user_permissions.remove(
            Permission.objects.get(
                codename="can_approve",
                content_type=ContentType.objects.get(
                    app_label="plugins", model="plugin"
                ),
            )
        )
        user_trust_notify(user)
        return Response(
            UserProfileSerializer(user, context={"request": request}).data
        )


class UserBlockView(APIView):
    """Disable a user account (staff only)."""

    permission_classes = [IsStaff]

    def post(self, request, username):
        user = get_object_or_404(User, username=username, is_staff=False)
        user.is_active = False
        user.save()
        return Response(
            UserProfileSerializer(user, context={"request": request}).data
        )


class UserUnblockView(APIView):
    """Re-enable a user account (staff only)."""

    permission_classes = [IsStaff]

    def post(self, request, username):
        user = get_object_or_404(User, username=username, is_staff=False)
        user.is_active = True
        user.save()
        return Response(
            UserProfileSerializer(user, context={"request": request}).data
        )
