# -*- coding: utf-8 -*-
"""
plugins/urls.py

Functional backend endpoints are kept as real Django views:
- XML feeds (consumed by QGIS application)
- RPC endpoint
- Version file download
- Token management (CI/CD token CRUD)
- CI/CD upload/update API
- Plugin rating

All HTML page routes (previously Django template views) now serve the
React SPA via FrontendView – React Router handles them client-side.
Named URL patterns are preserved so that reverse() continues to work.
"""

from django.contrib.auth.decorators import login_required
from django.urls import re_path as url
from django.utils.translation import gettext_lazy as _
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_POST

from djangoratings.views import AddRatingFromModel
from frontend.views import FrontendView
from plugins.models import Plugin
from plugins.views import (
    PluginTokenDetailView,
    PluginTokenListView,
    plugin_token_create,
    plugin_token_delete,
    plugin_token_update,
    version_create_api,
    version_download,
    version_update_api,
    xml_plugins,
    xml_plugins_new,
)
from rpc4django.views import serve_rpc_request

# ── Functional backend-only endpoints (NOT replaced by React) ──────────────────

urlpatterns = [
    # XML feeds (consumed by the QGIS application – must NOT change)
    url(r"^plugins_new.xml$", xml_plugins_new, {}, name="xml_plugins_new"),
    url(r"^plugins.xml$", xml_plugins, {}, name="xml_plugins"),
    url(
        r"^plugins_(?P<qg_version>\d+\.\d+).xml$",
        xml_plugins,
        {},
        name="xml_plugins_version_filtered_cached",
    ),
    url(
        r"^version_filtered/(?P<qg_version>\d+\.\d+).xml$",
        xml_plugins,
        {},
        name="xml_plugins_version_filtered_uncached",
    ),

    # RPC2 (used by QGIS)
    url(r"^RPC2/$", serve_rpc_request),

    # CI/CD token-based upload/update API
    url(
        r"^api/(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/add/$",
        version_create_api,
        {},
        name="version_create_api",
    ),
    url(
        r"^api/(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/update/$",
        version_update_api,
        {},
        name="version_update_api",
    ),

    # Version file download (returns a zip; must stay as a real Django view)
    url(
        r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/download/$",
        version_download,
        {},
        name="version_download",
    ),

    # Token management (HTML form pages; kept as Django for CI/CD workflows)
    url(
        r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/tokens/$",
        PluginTokenListView.as_view(),
        name="plugin_token_list",
    ),
    url(
        r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/tokens/(?P<pk>\d+)/$",
        PluginTokenDetailView.as_view(),
        name="plugin_token_detail",
    ),
    url(
        r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/tokens/create/$",
        plugin_token_create,
        {},
        name="plugin_token_create",
    ),
    url(
        r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/tokens/(?P<token_id>\d+)/update$",
        plugin_token_update,
        {},
        name="plugin_token_update",
    ),
    url(
        r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/tokens/(?P<token_id>[^\/]+)/delete/$",
        plugin_token_delete,
        {},
        name="plugin_token_delete",
    ),

    # Plugin rating
    url(
        r"rate/(?P<object_id>\d+)/(?P<score>\d+)/",
        require_POST(csrf_protect(AddRatingFromModel())),
        {
            "app_label": "plugins",
            "model": "plugin",
            "field_name": "rating",
        },
        name="plugin_rate",
    ),
]

# ── React SPA – page routes (FrontendView serves app.html for all of these) ────
# Named patterns are preserved so that reverse() still works throughout the codebase.

spa = FrontendView.as_view()

urlpatterns += [
    # Plugin lists
    url(r"^$", spa, name="approved_plugins"),
    url(r"^my$", login_required(spa), name="my_plugins"),
    url(r"^add/$", login_required(spa), name="plugin_upload"),
    url(r"^add-empty/$", login_required(spa), name="plugin_create_empty"),
    url(r"^fresh/$", spa, name="fresh_plugins"),
    url(r"^latest/$", spa, name="latest_plugins"),
    url(r"^stable/$", spa, name="stable_plugins"),
    url(r"^experimental/$", spa, name="experimental_plugins"),
    url(r"^server/$", spa, name="server_plugins"),
    url(r"^deprecated/$", spa, name="deprecated_plugins"),
    url(r"^popular/$", spa, name="popular_plugins"),
    url(r"^most_voted/$", spa, name="most_voted_plugins"),
    url(r"^most_downloaded/$", spa, name="most_downloaded_plugins"),
    url(r"^best_rated/$", spa, name="best_rated_plugins"),
    url(r"^unapproved/$", spa, name="unapproved_plugins"),
    url(r"^featured/$", spa, name="featured_plugins"),
    url(r"^new_qgis_ready/$", spa, name="new_qgis_ready_plugins"),
    url(r"^feedback_completed/$", spa, name="feedback_completed_plugins"),
    url(r"^feedback_pending/$", spa, name="feedback_pending_plugins"),
    url(r"^feedback_received/$", spa, name="feedback_received_plugins"),
    url(r"^awaiting_deletion/$", spa, name="awaiting_deletion_plugins"),

    # Filtered lists by tag / user / author
    url(r"^tags/(?P<tags>[^\/]+)/$", spa, name="tags_plugins"),
    url(r"^user/(?P<username>\w+)/$", spa, name="user_plugins"),
    url(r"^user/(?P<username>\w+)/admin$", spa, name="user_details"),
    url(r"^author/(?P<author>[^/]+)/$", spa, name="author_plugins"),

    # Plugin CRUD (now handled via DRF API; these serve the SPA shell)
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/manage/$", spa, name="plugin_manage"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/update/$", login_required(spa), name="plugin_update"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/delete/$", login_required(spa), name="plugin_delete"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/restore/$", login_required(spa), name="plugin_restore"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/permanent-delete/$", login_required(spa), name="plugin_permanent_delete"),

    # User management pages
    url(r"^user/(?P<username>\w+)/block/$", spa, name="user_block"),
    url(r"^user/(?P<username>\w+)/unblock/$", spa, name="user_unblock"),
    url(r"^user/(?P<username>\w+)/trust/$", spa, name="user_trust"),
    url(r"^user/(?P<username>\w+)/untrust/$", spa, name="user_untrust"),
    url(r"^user/(?P<username>\w+)/manage/$", spa, name="user_permissions_manage"),

    # Version management pages
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/add/$", login_required(spa), name="version_create"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/manage/$", spa, name="version_manage"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/$", spa, name="version_detail"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/delete/$", login_required(spa), name="version_delete"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/update/$", login_required(spa), name="version_update"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/approve/$", spa, name="version_approve"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/unapprove/$", spa, name="version_unapprove"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/feedback/$", spa, name="version_feedback"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/feedback/update/$", spa, name="version_feedback_update"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/feedback/(?P<feedback>[0-9]+)/delete/$", spa, name="version_feedback_delete"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/version/(?P<version>[^\/]+)/feedback/(?P<feedback>[0-9]+)/edit/$", spa, name="version_feedback_edit"),
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/bulk_delete_versions/$", spa, name="versions_bulk_delete"),

    # Plugin detail (must be LAST to avoid shadowing other patterns)
    url(r"^(?P<package_name>[A-Za-z][A-Za-z0-9-_]+)/$", spa, name="plugin_detail"),
]
