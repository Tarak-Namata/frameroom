# Frameroom Round 2: setup wizard lockdown, settings (branding/email/general), friendly errors
import os
import io
import uuid
import sqlite3
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
OWNER = {"email": "owner@frameroom.dev", "password": "frameroom123"}


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=OWNER)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code}")
    return s


# --- Setup wizard permanently disabled ---
class TestSetupLocked:
    def test_get_setup_complete(self):
        d = requests.get(f"{BASE_URL}/api/auth/setup").json()
        assert d["setupComplete"] is True
        assert d["codeRequired"] is True

    def test_post_setup_403_with_correct_code(self):
        r = requests.post(f"{BASE_URL}/api/auth/setup", json={"setupCode": "frame-2026", "name": "X", "email": "x@x.dev", "password": "12345678"})
        assert r.status_code == 403
        msg = str(r.json())
        assert "already set up" in msg

    def test_post_setup_403_checkonly(self):
        r = requests.post(f"{BASE_URL}/api/auth/setup", json={"setupCode": "frame-2026", "checkOnly": True})
        assert r.status_code == 403

    def test_setup_page_redirect_logged_out(self):
        r = requests.get(f"{BASE_URL}/setup", allow_redirects=False)
        assert r.status_code in (302, 307, 308)
        assert "/login" in r.headers.get("location", "")

    def test_setup_page_redirect_logged_in(self, admin):
        r = admin.get(f"{BASE_URL}/setup", allow_redirects=False)
        assert r.status_code in (302, 307, 308)
        assert "/admin" in r.headers.get("location", "")

    def test_single_owner_bcrypt(self):
        db = "/app/frontend/data/frameroom.db"
        if not os.path.exists(db):
            pytest.skip("db path unknown")
        con = sqlite3.connect(db)
        rows = con.execute("select id,email,passwordHash from User").fetchall()
        assert len(rows) == 1 and rows[0][0] == "owner" and rows[0][1] == OWNER["email"]
        assert rows[0][2].startswith("$2")


# --- Settings / branding saved by wizard ---
class TestSettings:
    def test_branding_saved(self, admin):
        d = admin.get(f"{BASE_URL}/api/admin/settings").json()
        # Real DB: Lens & Light; demo DB (DEMO_MODE): Lumen & Co. Photography
        assert d["studioName"] in ("Lens & Light", "Lumen & Co. Photography")
        if d["studioName"] == "Lens & Light":
            assert d["accentColor"].upper() == "#C85A32"
            assert d["hasLogo"] is True
        assert d["appUrlFromEnv"] == BASE_URL

    def test_logo_public(self):
        r = requests.get(f"{BASE_URL}/api/logo")
        assert r.status_code == 200 and r.headers["content-type"].startswith("image/")

    def test_invalid_color_friendly(self, admin):
        r = admin.patch(f"{BASE_URL}/api/admin/settings", json={"accentColor": "red"})
        assert r.status_code == 400 and "hex" in str(r.json())

    def test_invalid_appurl(self, admin):
        r = admin.patch(f"{BASE_URL}/api/admin/settings", json={"appUrl": "foo bar"})
        assert r.status_code == 400


# --- SMTP email settings ---
class TestEmail:
    def test_save_no_secret_leak(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/settings/email", json={"host": "smtp.invalid.example", "port": 587, "secure": False, "user": "u@x.dev", "password": "TOPSECRET_pw", "from": "hello@lens.dev"})
        assert r.status_code == 200, r.text
        assert r.json()["configured"] is True and r.json()["hasPassword"] is True
        g = admin.get(f"{BASE_URL}/api/admin/settings")
        txt = g.text
        assert "TOPSECRET_pw" not in txt and "smtpPassEnc" not in txt and "passEnc" not in txt
        e = g.json()["email"]
        assert "password" not in e
        assert e["hasPassword"] is True and e["host"] == "smtp.invalid.example"

    def test_blank_password_keeps(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/settings/email", json={"host": "smtp.invalid.example", "port": 2525, "secure": False, "user": "u@x.dev", "password": "", "from": "hello@lens.dev"})
        assert r.status_code == 200
        e = admin.get(f"{BASE_URL}/api/admin/settings").json()["email"]
        assert e["hasPassword"] is True and e["port"] == 2525

    def test_validation_friendly(self, admin):
        assert admin.put(f"{BASE_URL}/api/admin/settings/email", json={"host": "", "from": "a@b.co"}).status_code == 400
        assert admin.put(f"{BASE_URL}/api/admin/settings/email", json={"host": "h", "port": "abc", "from": "a@b.co"}).status_code == 400
        assert admin.put(f"{BASE_URL}/api/admin/settings/email", json={"host": "h", "port": 70000, "from": "a@b.co"}).status_code == 400
        assert admin.put(f"{BASE_URL}/api/admin/settings/email", json={"host": "h", "from": "nope"}).status_code == 400

    def test_test_email_friendly(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/settings/email/test", timeout=60)
        assert r.status_code == 422, r.text
        msg = str(r.json())
        assert "EDNS" not in msg and "ENOTFOUND" not in msg and "getaddrinfo" not in msg
        print("SMTP test msg:", msg)

    def test_remove(self, admin):
        assert admin.delete(f"{BASE_URL}/api/admin/settings/email").status_code == 200
        e = admin.get(f"{BASE_URL}/api/admin/settings").json()["email"]
        assert e["configured"] is False and e["hasPassword"] is False

    def test_email_requires_auth(self):
        assert requests.put(f"{BASE_URL}/api/admin/settings/email", json={}).status_code == 401
        assert requests.post(f"{BASE_URL}/api/admin/settings/email/test").status_code == 401


# --- Friendly errors ---
class TestFriendlyErrors:
    def test_login_wrong_pw_message(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": f"TEST_{uuid.uuid4().hex[:6]}@x.dev", "password": "nope"})
        assert r.status_code == 401
        assert "don't match" in str(r.json()) or "don’t match" in str(r.json())

    def test_share_url_uses_app_url(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/galleries", json={"title": "TEST_share", "password": "abcd1"})
        assert r.status_code == 201, r.text
        g = r.json()
        try:
            d = admin.get(f"{BASE_URL}/api/admin/galleries/{g['id']}").json()
            share = d.get("shareUrl") or d.get("gallery", {}).get("shareUrl")
            print("share", share)
            if share:
                assert share.startswith(BASE_URL)
            s = requests.Session()
            u = s.post(f"{BASE_URL}/api/g/{g['slug']}/unlock", json={"password": "wrong"})
            assert u.status_code == 401
            print("unlock wrong:", u.json())
        finally:
            admin.delete(f"{BASE_URL}/api/admin/galleries/{g['id']}")

    def test_unknown_api_json(self):
        r = requests.get(f"{BASE_URL}/api/admin/galleries/doesnotexist", cookies={})
        assert r.status_code in (401, 404)
