# coding=utf-8
"""
DRF serializers for the plugins application.
"""

from django.contrib.auth.models import User
from rest_framework import serializers

from plugins.models import Plugin, PluginVersion


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class PluginVersionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = PluginVersion
        fields = [
            "id",
            "version",
            "min_qg_version",
            "max_qg_version",
            "created_on",
            "created_by",
            "approved",
            "experimental",
            "changelog",
            "supports_qt6",
            "download_url",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = obj.get_absolute_url() + "download/"
        if request:
            return request.build_absolute_uri(url)
        return url


class PluginSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    tags = serializers.SerializerMethodField()
    icon_url = serializers.SerializerMethodField()
    latest_version = serializers.SerializerMethodField()
    absolute_url = serializers.SerializerMethodField()

    class Meta:
        model = Plugin
        fields = [
            "id",
            "package_name",
            "name",
            "description",
            "about",
            "author",
            "email",
            "icon_url",
            "created_on",
            "created_by",
            "repository",
            "tracker",
            "homepage",
            "deprecated",
            "approved",
            "featured",
            "downloads",
            "tags",
            "latest_version",
            "absolute_url",
        ]

    def get_tags(self, obj):
        return list(obj.tags.values_list("name", flat=True))

    def get_icon_url(self, obj):
        request = self.context.get("request")
        if obj.icon:
            if request:
                return request.build_absolute_uri(obj.icon.url)
            return obj.icon.url
        return None

    def get_latest_version(self, obj):
        version = obj.stable or obj.experimental
        if version:
            return {
                "id": version.pk,
                "version": version.version,
                "min_qg_version": version.min_qg_version,
                "max_qg_version": version.max_qg_version,
                "created_on": version.created_on,
                "experimental": version.experimental,
                "supports_qt6": version.supports_qt6,
            }
        return None

    def get_absolute_url(self, obj):
        request = self.context.get("request")
        url = obj.get_absolute_url()
        if request:
            return request.build_absolute_uri(url)
        return url


class PluginVersionDetailSerializer(PluginVersionSerializer):
    """Full version serializer including downloads count."""

    downloads = serializers.IntegerField(read_only=True)

    class Meta(PluginVersionSerializer.Meta):
        fields = PluginVersionSerializer.Meta.fields + ["downloads"]


class PluginDetailSerializer(PluginSerializer):
    """Extended serializer with version list and permission flags."""

    versions = serializers.SerializerMethodField()
    owners = UserSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_approve = serializers.SerializerMethodField()

    class Meta(PluginSerializer.Meta):
        fields = PluginSerializer.Meta.fields + [
            "versions",
            "owners",
            "can_edit",
            "can_approve",
        ]

    def get_versions(self, obj):
        request = self.context.get("request")
        # Staff and editors see all versions; others only approved ones
        if request and request.user.is_authenticated and (
            request.user.is_staff or request.user in obj.editors
        ):
            versions = obj.pluginversion_set.all().order_by("-created_on")
        else:
            versions = obj.pluginversion_set.filter(approved=True).order_by(
                "-created_on"
            )
        return PluginVersionDetailSerializer(
            versions, many=True, context=self.context
        ).data

    def get_can_edit(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user in obj.editors

    def get_can_approve(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return request.user.is_staff or (
            request.user in obj.editors
            and request.user.has_perm("plugins.can_approve")
        )


class UserProfileSerializer(serializers.ModelSerializer):
    """Public user profile."""

    is_trusted = serializers.SerializerMethodField()
    plugins_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "is_staff",
            "is_trusted",
            "plugins_count",
            "date_joined",
        ]

    def get_is_trusted(self, obj):
        return obj.has_perm("plugins.can_approve")

    def get_plugins_count(self, obj):
        return Plugin.approved_objects.filter(created_by=obj).count()
