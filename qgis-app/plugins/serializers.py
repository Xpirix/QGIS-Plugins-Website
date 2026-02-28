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


class PluginDetailSerializer(PluginSerializer):
    """Extended serializer with version list for the detail endpoint."""

    versions = serializers.SerializerMethodField()

    class Meta(PluginSerializer.Meta):
        fields = PluginSerializer.Meta.fields + ["versions"]

    def get_versions(self, obj):
        versions = obj.pluginversion_set.filter(approved=True).order_by("-created_on")
        return PluginVersionSerializer(
            versions, many=True, context=self.context
        ).data
