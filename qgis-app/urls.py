import simplemenu
from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.contrib.flatpages.models import FlatPage
from django.urls import include, path
from django.urls import re_path as url
from django.views.static import serve
from drf_yasg import openapi
from drf_yasg.views import get_schema_view

# to find users app views
# from users.views import *
from plugins.api_views import (
    ApiStatusView,
    AppConfigView,
    PluginDeleteView,
    PluginDetailView,
    PluginListView,
    PluginUploadView,
    PluginVersionApproveView,
    PluginVersionDeleteView,
    PluginVersionDetailView,
    PluginVersionUnapproveView,
    TagListView,
    UserBlockView,
    UserDetailView,
    UserProfileView,
    UserTrustView,
    UserUnblockView,
    UserUntrustView,
)
from rest_framework import permissions
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

admin.autodiscover()


schema_view = get_schema_view(
    openapi.Info(
        title="QGIS Plugins API",
        default_version="v1",
        description="REST API for the QGIS Plugins Repository",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="admin@qgis.org"),
        license=openapi.License(name="CC"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Django admin
    url(r"^admin/", admin.site.urls),

    # ── Plugins app (XML feeds, RPC, downloads, token CI/CD API) ──────────────
    url(r"^plugins/", include("plugins.urls")),

    # ── Search ────────────────────────────────────────────────────────────────
    url(r"^search/", include("custom_haystack_urls")),
    url(r"^search/", include("haystack.urls")),

    # ABP: autosuggest for tags
    url(r"^taggit_autosuggest/", include("taggit_autosuggest.urls")),
    url(r"^userexport/", include("userexport.urls")),

    # ── REST API v1 ───────────────────────────────────────────────────────────
    path("api/v1/", ApiStatusView.as_view(), name="api_v1_status"),
    path("api/v1/config/", AppConfigView.as_view(), name="api_config"),

    # Plugins
    path("api/v1/plugins/", PluginListView.as_view(), name="api_plugin_list"),
    path("api/v1/plugins/upload/", PluginUploadView.as_view(), name="api_plugin_upload"),
    path(
        "api/v1/plugins/<str:package_name>/",
        PluginDetailView.as_view(),
        name="api_plugin_detail",
    ),
    path(
        "api/v1/plugins/<str:package_name>/delete/",
        PluginDeleteView.as_view(),
        name="api_plugin_delete",
    ),

    # Plugin Versions
    path(
        "api/v1/plugins/<str:package_name>/versions/<str:version>/",
        PluginVersionDetailView.as_view(),
        name="api_version_detail",
    ),
    path(
        "api/v1/plugins/<str:package_name>/versions/<str:version>/approve/",
        PluginVersionApproveView.as_view(),
        name="api_version_approve",
    ),
    path(
        "api/v1/plugins/<str:package_name>/versions/<str:version>/unapprove/",
        PluginVersionUnapproveView.as_view(),
        name="api_version_unapprove",
    ),
    path(
        "api/v1/plugins/<str:package_name>/versions/<str:version>/delete/",
        PluginVersionDeleteView.as_view(),
        name="api_version_delete",
    ),

    # Tags
    path("api/v1/tags/", TagListView.as_view(), name="api_tag_list"),

    # User
    path("api/v1/user/me/", UserProfileView.as_view(), name="api_user_me"),
    path("api/v1/user/<str:username>/", UserDetailView.as_view(), name="api_user_detail"),
    path("api/v1/user/<str:username>/trust/", UserTrustView.as_view(), name="api_user_trust"),
    path("api/v1/user/<str:username>/untrust/", UserUntrustView.as_view(), name="api_user_untrust"),
    path("api/v1/user/<str:username>/block/", UserBlockView.as_view(), name="api_user_block"),
    path("api/v1/user/<str:username>/unblock/", UserUnblockView.as_view(), name="api_user_unblock"),

    # JWT authentication
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # API documentation (Swagger / ReDoc)
    url(
        r"^api/v1/docs/swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    url(
        r"^api/v1/docs/swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    url(
        r"^api/v1/docs/redoc/$",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
]

# ABP: temporary home page
# urlpatterns += patterns('django.views.generic.simple',
#    url(r'^$', 'direct_to_template', {'template': 'index.html'}, name = 'index'),
# )


# serving static media
from django.conf.urls.static import static

if settings.SERVE_STATIC_MEDIA:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# auth
urlpatterns += [
    path("accounts/", include("django.contrib.auth.urls")),
]

# tinymce
# urlpatterns += [
#     url(r"^tinymce/", include("tinymce.urls")),
# ]


# Home and documentation pages – now served by the React SPA.
# The named URL references (reverse("homepage") etc.) are preserved.
from frontend.views import FrontendView

urlpatterns += [
    url(r"^$", FrontendView.as_view(), name="homepage"),
    url(r"^docs/publish", FrontendView.as_view(), name="docs_publish"),
    url(r"^docs/approval", FrontendView.as_view(), name="docs_approval"),
    url(r"^docs/faq", FrontendView.as_view(), name="docs_faq"),
    url(
        r"^docs/security-scanning",
        FrontendView.as_view(),
        name="docs_security_scanning",
    ),
]


if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [
        url(r"^__debug__/", include(debug_toolbar.urls)),
    ]

# ── React SPA catch-all (MUST be last) ────────────────────────────────────────
# All URLs not matched by the patterns above are served by the React SPA.
# React Router handles client-side routing from here.
urlpatterns += [
    url(r"^", include("frontend.urls")),
]

simplemenu.register(
    "/admin/",
    # All plugins
    "/plugins/",
    # My plugins
    "/plugins/my",
    # Unapproved plugins
    "/plugins/unapproved/",
    "/plugins/feedback_completed/",
    "/plugins/feedback_received/",
    "/plugins/feedback_pending/",
    # New plugins
    "/plugins/fresh/",
    "/plugins/latest/",
    # Top plugins
    "/plugins/featured/",
    "/plugins/popular/",
    "/plugins/most_voted/",
    "/plugins/most_downloaded/",
    "/plugins/best_rated/",
    # Category
    "/plugins/stable/",
    "/plugins/experimental/",
    "/plugins/server/",
    "/plugins/deprecated/",
    FlatPage.objects.all(),
    simplemenu.models.URLItem.objects.all(),
)
