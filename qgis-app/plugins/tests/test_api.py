# coding=utf-8
"""
Tests for the DRF REST API endpoints added in the React/DRF migration.
"""
import os
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from plugins.models import Plugin, PluginVersion

TESTFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "testfiles"))


def do_nothing(*args, **kwargs):
    pass


class ApiStatusViewTestCase(TestCase):
    """Test the API status / health-check endpoint."""

    def test_api_status_returns_200(self):
        response = self.client.get(reverse("api_v1_status"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/json", response["Content-Type"])

    def test_api_status_response_structure(self):
        response = self.client.get(reverse("api_v1_status"))
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "1")
        self.assertIn("endpoints", data)
        self.assertIn("plugins", data["endpoints"])
        self.assertIn("token_obtain", data["endpoints"])


class PluginListApiTestCase(TestCase):
    """Test the /api/v1/plugins/ list endpoint."""

    fixtures = ["fixtures/auth.json"]

    @override_settings(MEDIA_ROOT="api/tests")
    def setUp(self):
        self.user = User.objects.create_user(
            username="apitestuser", password="apitestpass", email="api@test.com"
        )
        self.client = Client()
        self.client.login(username="apitestuser", password="apitestpass")

        # Upload a plugin so there is at least one approved plugin
        url_upload = reverse("plugin_upload")
        valid_plugin = os.path.join(TESTFILE_DIR, "valid_plugin.zip_")
        with open(valid_plugin, "rb") as f:
            uploaded = SimpleUploadedFile(
                "valid_plugin.zip_", f.read(), content_type="application/zip"
            )
        with patch("plugins.tasks.generate_plugins_xml", new=do_nothing):
            with patch("plugins.validator._check_url_link", new=do_nothing):
                self.client.post(url_upload, {"package": uploaded})

        self.plugin = Plugin.objects.filter(name="Test Plugin").first()
        if self.plugin:
            # Approve the version so it shows up in the approved list
            version = self.plugin.pluginversion_set.first()
            if version:
                version.approved = True
                version.save()
        self.client.logout()

    def test_plugin_list_accessible_without_auth(self):
        response = self.client.get(reverse("api_plugin_list"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/json", response["Content-Type"])

    def test_plugin_list_response_structure(self):
        response = self.client.get(reverse("api_plugin_list"))
        data = response.json()
        # DRF paginated response
        self.assertIn("count", data)
        self.assertIn("results", data)
        self.assertIsInstance(data["results"], list)

    def test_plugin_list_search(self):
        response = self.client.get(
            reverse("api_plugin_list"), {"search": "Test Plugin"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)

    def test_plugin_list_pagination(self):
        response = self.client.get(
            reverse("api_plugin_list"), {"page_size": 5}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("count", data)
        self.assertIn("next", data)
        self.assertIn("previous", data)


class PluginDetailApiTestCase(TestCase):
    """Test the /api/v1/plugins/<package_name>/ detail endpoint."""

    fixtures = ["fixtures/auth.json"]

    @override_settings(MEDIA_ROOT="api/tests")
    def setUp(self):
        self.user = User.objects.create_user(
            username="detailtestuser", password="detailpass", email="detail@test.com"
        )
        self.client = Client()
        self.client.login(username="detailtestuser", password="detailpass")

        url_upload = reverse("plugin_upload")
        valid_plugin = os.path.join(TESTFILE_DIR, "valid_plugin.zip_")
        with open(valid_plugin, "rb") as f:
            uploaded = SimpleUploadedFile(
                "valid_plugin.zip_", f.read(), content_type="application/zip"
            )
        with patch("plugins.tasks.generate_plugins_xml", new=do_nothing):
            with patch("plugins.validator._check_url_link", new=do_nothing):
                self.client.post(url_upload, {"package": uploaded})

        self.plugin = Plugin.objects.filter(name="Test Plugin").first()
        if self.plugin:
            version = self.plugin.pluginversion_set.first()
            if version:
                version.approved = True
                version.save()
        self.client.logout()

    def test_plugin_detail_accessible_without_auth(self):
        if not self.plugin:
            self.skipTest("No test plugin available")
        response = self.client.get(
            reverse("api_plugin_detail", args=[self.plugin.package_name])
        )
        self.assertEqual(response.status_code, 200)

    def test_plugin_detail_response_structure(self):
        if not self.plugin:
            self.skipTest("No test plugin available")
        response = self.client.get(
            reverse("api_plugin_detail", args=[self.plugin.package_name])
        )
        data = response.json()
        self.assertIn("id", data)
        self.assertIn("package_name", data)
        self.assertIn("name", data)
        self.assertIn("versions", data)
        self.assertEqual(data["package_name"], self.plugin.package_name)

    def test_plugin_detail_404_for_unknown(self):
        response = self.client.get(
            reverse("api_plugin_detail", args=["nonexistent_plugin"])
        )
        self.assertEqual(response.status_code, 404)


class JwtAuthEndpointTestCase(TestCase):
    """Test that the JWT token obtain/refresh endpoints are available."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="jwtuser", password="jwtpass", email="jwt@test.com"
        )

    def test_token_obtain_endpoint_exists(self):
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "jwtuser", "password": "jwtpass"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_token_obtain_invalid_credentials(self):
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "jwtuser", "password": "wrongpassword"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_token_refresh_endpoint_exists(self):
        # First obtain tokens
        obtain_response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "jwtuser", "password": "jwtpass"},
            content_type="application/json",
        )
        refresh_token = obtain_response.json()["refresh"]

        # Now refresh
        refresh_response = self.client.post(
            reverse("token_refresh"),
            {"refresh": refresh_token},
            content_type="application/json",
        )
        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.json())

    def test_token_verify_endpoint_exists(self):
        obtain_response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "jwtuser", "password": "jwtpass"},
            content_type="application/json",
        )
        access_token = obtain_response.json()["access"]

        verify_response = self.client.post(
            reverse("token_verify"),
            {"token": access_token},
            content_type="application/json",
        )
        self.assertEqual(verify_response.status_code, 200)
