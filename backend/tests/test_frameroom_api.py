# Frameroom API regression tests (Next.js route handlers via public URL)
import io
import os
import uuid
import zipfile

import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
OWNER = {"email": "owner@frameroom.dev", "password": "frameroom123"}


def img_bytes(fmt="JPEG", color=(200, 100, 50), size=(800, 600)):
    b = io.BytesIO()
    Image.new("RGB", size, color).save(b, fmt)
    return b.getvalue()


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=OWNER)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def gallery(admin):
    r = admin.post(f"{BASE_URL}/api/admin/galleries", json={"title": "TEST_pw_gallery", "password": "testpw1"})
    assert r.status_code == 201, r.text
    g = r.json()
    files = [("files", ("a.jpg", img_bytes("JPEG"), "image/jpeg")), ("files", ("b.png", img_bytes("PNG", (10, 90, 200)), "image/png"))]
    up = admin.post(f"{BASE_URL}/api/admin/galleries/{g['id']}/photos", files=files)
    assert up.status_code == 201, up.text
    g["photos"] = up.json()["photos"]
    yield g
    admin.delete(f"{BASE_URL}/api/admin/galleries/{g['id']}")


# Health / auth
class TestAuth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200

    def test_login_sets_httponly_cookie(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json=OWNER)
        assert r.status_code == 200
        assert r.json()["email"] == OWNER["email"]
        sc = r.headers.get("set-cookie", "")
        assert "fr_session=" in sc and "HttpOnly" in sc

    def test_me(self, admin):
        r = admin.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert "owner@frameroom.dev" in r.text

    def test_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": f"TEST_{uuid.uuid4().hex[:6]}@x.dev", "password": "nope"})
        assert r.status_code == 401
        assert "error" in r.json()

    def test_lockout_after_5(self):
        email = f"TEST_lock_{uuid.uuid4().hex[:6]}@x.dev"
        codes = [requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "bad"}).status_code for _ in range(6)]
        assert codes[:5] == [401] * 5
        assert codes[5] == 429

    def test_lockout_bypass_via_xff(self):
        # security: spoofed X-Forwarded-For should not reset lockout
        email = f"TEST_xff_{uuid.uuid4().hex[:6]}@x.dev"
        for _ in range(5):
            requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "bad"})
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "bad"}, headers={"X-Forwarded-For": "1.2.3.4"})
        assert r.status_code == 429, f"lockout bypassed with spoofed XFF -> {r.status_code}"

    def test_setup_forbidden(self):
        r = requests.post(f"{BASE_URL}/api/auth/setup", json={"name": "x", "email": "x@x.dev", "password": "12345678"})
        assert r.status_code == 403

    def test_admin_401_logged_out(self):
        for p in ["clients", "galleries", "settings"]:
            assert requests.get(f"{BASE_URL}/api/admin/{p}").status_code == 401


# Clients CRUD
class TestClients:
    def test_client_crud(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/clients", json={"name": "TEST_Client", "email": "t@x.dev", "notes": "n"})
        assert r.status_code == 201
        c = r.json()
        assert c["name"] == "TEST_Client"
        r = admin.patch(f"{BASE_URL}/api/admin/clients/{c['id']}", json={"name": "TEST_Client2", "email": "t2@x.dev"})
        assert r.status_code == 200 and r.json()["name"] == "TEST_Client2"
        lst = admin.get(f"{BASE_URL}/api/admin/clients").json()
        assert any(x["id"] == c["id"] and x["name"] == "TEST_Client2" for x in lst)
        assert admin.delete(f"{BASE_URL}/api/admin/clients/{c['id']}").status_code == 200
        assert not any(x["id"] == c["id"] for x in admin.get(f"{BASE_URL}/api/admin/clients").json())

    def test_client_validation(self, admin):
        assert admin.post(f"{BASE_URL}/api/admin/clients", json={"name": ""}).status_code == 400
        assert admin.post(f"{BASE_URL}/api/admin/clients", json={"name": "x", "email": "bad"}).status_code == 400


# Galleries / photos / public access
class TestGalleries:
    def test_gallery_get(self, admin, gallery):
        r = admin.get(f"{BASE_URL}/api/admin/galleries/{gallery['id']}")
        assert r.status_code == 200
        d = r.json()
        assert d["hasPassword"] is True and len(d["photos"]) == 2 and "passwordHash" not in d

    def test_upload_reject_non_image(self, admin, gallery):
        r = admin.post(f"{BASE_URL}/api/admin/galleries/{gallery['id']}/photos", files=[("files", ("x.txt", b"hello", "text/plain"))])
        assert r.status_code == 400

    def test_upload_reject_spoofed_mime(self, admin, gallery):
        r = admin.post(f"{BASE_URL}/api/admin/galleries/{gallery['id']}/photos", files=[("files", ("x.jpg", b"notimage" * 100, "image/jpeg"))])
        assert r.status_code == 400

    def test_upload_reject_too_large(self, admin, gallery):
        big = b"\xff\xd8" + b"0" * (26 * 1024 * 1024)
        r = admin.post(f"{BASE_URL}/api/admin/galleries/{gallery['id']}/photos", files=[("files", ("big.jpg", big, "image/jpeg"))])
        assert r.status_code in (400, 413)

    def test_public_locked(self, gallery):
        slug, pid = gallery["slug"], gallery["photos"][0]["id"]
        assert requests.get(f"{BASE_URL}/api/g/{slug}/photos/{pid}?v=thumb").status_code == 404
        assert requests.get(f"{BASE_URL}/api/g/{slug}/download").status_code == 404

    def test_unlock_wrong_then_right(self, gallery):
        s = requests.Session()
        slug, pid = gallery["slug"], gallery["photos"][0]["id"]
        assert s.post(f"{BASE_URL}/api/g/{slug}/unlock", json={"password": "wrong"}).status_code == 401
        r = s.post(f"{BASE_URL}/api/g/{slug}/unlock", json={"password": "testpw1"})
        assert r.status_code == 200
        t = s.get(f"{BASE_URL}/api/g/{slug}/photos/{pid}?v=thumb")
        assert t.status_code == 200 and t.headers["content-type"] == "image/webp"
        o = s.get(f"{BASE_URL}/api/g/{slug}/photos/{pid}?v=original")
        assert o.status_code == 200 and "attachment" in o.headers.get("content-disposition", "")
        z = s.get(f"{BASE_URL}/api/g/{slug}/download")
        assert z.status_code == 200
        names = zipfile.ZipFile(io.BytesIO(z.content)).namelist()
        assert sorted(names) == ["a.jpg", "b.png"]

    def test_password_change_invalidates_cookie(self, admin, gallery):
        s = requests.Session()
        slug, pid = gallery["slug"], gallery["photos"][0]["id"]
        s.post(f"{BASE_URL}/api/g/{slug}/unlock", json={"password": "testpw1"})
        admin.patch(f"{BASE_URL}/api/admin/galleries/{gallery['id']}", json={"password": "newpw22"})
        assert s.get(f"{BASE_URL}/api/g/{slug}/photos/{pid}?v=thumb").status_code == 404
        # remove password -> public
        admin.patch(f"{BASE_URL}/api/admin/galleries/{gallery['id']}", json={"password": None})
        assert requests.get(f"{BASE_URL}/api/g/{slug}/photos/{pid}?v=thumb").status_code == 200
        admin.patch(f"{BASE_URL}/api/admin/galleries/{gallery['id']}", json={"password": "testpw1"})

    def test_patch_invalid_client(self, admin, gallery):
        r = admin.patch(f"{BASE_URL}/api/admin/galleries/{gallery['id']}", json={"clientId": "doesnotexist"})
        assert r.status_code in (400, 404), f"got {r.status_code}"

    def test_delete_photo(self, admin, gallery):
        pid = gallery["photos"][1]["id"]
        assert admin.delete(f"{BASE_URL}/api/admin/photos/{pid}").status_code == 200
        d = admin.get(f"{BASE_URL}/api/admin/galleries/{gallery['id']}").json()
        assert all(p["id"] != pid for p in d["photos"])

    def test_random_slug_404(self):
        assert requests.get(f"{BASE_URL}/api/g/nonexistent123/download").status_code == 404
        assert requests.get(f"{BASE_URL}/g/nonexistent123").status_code == 404


# Settings
class TestSettings:
    def test_settings_validation(self, admin):
        r = admin.patch(f"{BASE_URL}/api/admin/settings", json={"studioName": "x", "accentColor": "red"})
        assert r.status_code == 400

    def test_settings_roundtrip(self, admin):
        cur = admin.get(f"{BASE_URL}/api/admin/settings").json()
        r = admin.patch(f"{BASE_URL}/api/admin/settings", json={"studioName": cur["studioName"], "accentColor": cur["accentColor"]})
        assert r.status_code == 200 and r.json()["accentColor"] == cur["accentColor"]
