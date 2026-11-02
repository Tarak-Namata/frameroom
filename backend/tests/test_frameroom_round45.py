# Frameroom rounds 4/5: health, demo seed, GPS stripping, CSV export (selected + comment-only), regression
import csv
import hashlib
import io
import os
import subprocess
import uuid

import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
OWNER = {"email": "owner@frameroom.dev", "password": "frameroom123"}
HEADER = ["filename", "selected", "comment", "client_name", "client_email", "submitted_at"]


def jpg(color, size=(400, 300)):
    b = io.BytesIO()
    Image.new("RGB", size, color).save(b, "JPEG")
    return b.getvalue()


def parse(text):
    return list(csv.reader(io.StringIO(text)))


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=OWNER)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code}")
    return s


@pytest.fixture(scope="module")
def gal(admin):
    r = admin.post(f"{BASE_URL}/api/admin/galleries", json={"title": "TEST_r5_csv"})
    assert r.status_code == 201, r.text
    g = r.json()
    files = [("files", (f"r5_{i}.jpg", jpg((i * 40, 90, 60)), "image/jpeg")) for i in range(5)]
    up = admin.post(f"{BASE_URL}/api/admin/galleries/{g['id']}/photos", files=files, timeout=120)
    assert up.status_code == 201, up.text
    g["photos"] = up.json()["photos"]
    yield g
    admin.delete(f"{BASE_URL}/api/admin/galleries/{g['id']}")


def selections(admin, gid):
    d = admin.get(f"{BASE_URL}/api/admin/galleries/{gid}/selections").json()
    return d.get("selections", d) if isinstance(d, dict) else d


# Health
def test_health():
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "database": "ok"}


# Demo seed
class TestDemo:
    def test_dashboard_counts(self, admin):
        gs = admin.get(f"{BASE_URL}/api/admin/galleries").json()
        demo = [g for g in gs if not g["title"].startswith("TEST_")]
        assert len(demo) == 3
        assert sum(g["_count"]["photos"] for g in demo) == 78

    def test_demo_selections(self, admin):
        gs = {g["title"]: g for g in admin.get(f"{BASE_URL}/api/admin/galleries").json()}
        wed = gs["Priya & Daniel — The Wedding"]
        assert wed["hasPassword"] and wed["maxSelections"] == 30
        s = selections(admin, wed["id"])
        assert s[0]["clientName"] == "Priya Sharma" and s[0]["status"] == "open"
        assert any(i["hearted"] for i in s[0]["items"]) and any(i["comment"] for i in s[0]["items"])
        por = gs["The Okafor Family — Autumn Portraits"]
        s = selections(admin, por["id"])
        assert s[0]["clientName"] == "Adaeze Okafor" and s[0]["status"] == "submitted"

    def test_demo_gallery_needs_password(self, admin):
        gs = {g["title"]: g for g in admin.get(f"{BASE_URL}/api/admin/galleries").json()}
        wed = gs["Priya & Daniel — The Wedding"]
        anon = requests.Session()
        r = anon.post(f"{BASE_URL}/api/g/{wed['slug']}/unlock", json={"password": "nope"})
        assert r.status_code == 401


# Round 5 CSV export
class TestCsv:
    def test_csv_selected_and_comment_only(self, admin, gal):
        c = requests.Session()
        email = f"test_{uuid.uuid4().hex[:6]}@x.dev"
        assert c.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing", json={"name": "TEST, \"Q\" Client", "email": email}).status_code == 200
        p = gal["photos"]
        put = lambda i, body: c.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/{p[i]['id']}", json=body)
        assert put(3, {"comment": "Only a note, no heart"}).status_code == 200  # comment-only first
        assert put(1, {"hearted": True}).status_code == 200
        assert put(0, {"hearted": True, "comment": "Love, \"this\" one"}).status_code == 200
        assert put(2, {"hearted": True}).status_code == 200
        assert put(2, {"hearted": False}).status_code == 200  # un-hearted, no comment -> excluded
        assert put(4, {"comment": "   "}).status_code == 200  # blank -> null -> excluded
        sel = [s for s in selections(admin, gal["id"]) if s["clientEmail"] == email][0]

        r = admin.get(f"{BASE_URL}/api/admin/selections/{sel['id']}/csv")
        assert r.status_code == 200 and "text/csv" in r.headers["content-type"]
        assert "attachment" in r.headers.get("content-disposition", "")
        rows = parse(r.text)
        assert rows[0] == HEADER
        body = rows[1:]
        assert [x[0] for x in body] == ["r5_0.jpg", "r5_1.jpg", "r5_3.jpg"]
        assert [x[1] for x in body] == ["yes", "yes", "no"]
        assert body[0][2] == 'Love, "this" one' and body[2][2] == "Only a note, no heart"
        assert all(x[3] == 'TEST, "Q" Client' and x[4] == email and x[5] == "" for x in body)

        r2 = admin.get(f"{BASE_URL}/api/admin/selections/{sel['id']}/csv?only=selected")
        assert r2.status_code == 200
        assert parse(r2.text) == [["filename"], ["r5_0.jpg"], ["r5_1.jpg"]]

        # submit -> submitted_at populated
        assert c.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing/submit").status_code == 200
        rows = parse(admin.get(f"{BASE_URL}/api/admin/selections/{sel['id']}/csv").text)
        assert rows[1][5] and rows[1][5].startswith("20") and all(x[5] == rows[1][5] for x in rows[1:])

    def test_csv_requires_auth(self, admin, gal):
        sel = selections(admin, gal["id"])[0]
        assert requests.get(f"{BASE_URL}/api/admin/selections/{sel['id']}/csv").status_code == 401

    def test_csv_404(self, admin):
        assert admin.get(f"{BASE_URL}/api/admin/selections/nope/csv").status_code == 404


# GPS stripping on upload (originals stay pixel-identical, Make survives)
class TestGps:
    @pytest.fixture(scope="class")
    def files(self):
        out = "/tmp/gpst"
        subprocess.run(["node", "scripts/test-strip.mjs", out], cwd="/app/frontend", check=True, capture_output=True)
        # extra PIL JPEG with GPS
        im = Image.new("RGB", (320, 240), (10, 120, 200))
        ex = Image.Exif()
        ex[0x010F] = "PilCam"
        ex[0x8825] = {1: "N", 2: (40.0, 26.0, 46.0), 3: "W", 4: (79.0, 58.0, 56.0)}
        im.save(f"{out}/pil_gps.jpg", "JPEG", exif=ex.tobytes(), quality=90)
        return out

    @pytest.mark.parametrize("name,mime,make", [("gps.jpg", "image/jpeg", "TestCam"), ("gps.png", "image/png", "TestCam"),
                                                ("gps.webp", "image/webp", "TestCam"), ("pil_gps.jpg", "image/jpeg", "PilCam")])
    def test_strip(self, admin, gal, files, name, mime, make):
        raw = open(f"{files}/{name}", "rb").read()
        src = Image.open(io.BytesIO(raw))
        assert src.getexif().get_ifd(0x8825), "source must contain GPS"
        up = admin.post(f"{BASE_URL}/api/admin/galleries/{gal['id']}/photos", files=[("files", (name, raw, mime))], timeout=120)
        assert up.status_code == 201, up.text
        pid = up.json()["photos"][0]["id"]
        r = admin.get(f"{BASE_URL}/api/g/{gal['slug']}/photos/{pid}?v=original")
        assert r.status_code == 200
        out = Image.open(io.BytesIO(r.content))
        ex = out.getexif()
        assert not ex.get_ifd(0x8825), f"GPS still present: {ex.get_ifd(0x8825)}"
        assert ex.get(0x010F) == make
        assert b"GPSLatitude" not in r.content
        assert hashlib.md5(out.convert("RGB").tobytes()).hexdigest() == hashlib.md5(src.convert("RGB").tobytes()).hexdigest()


# Large batch upload API
def test_batch_upload(admin, gal):
    files = [("files", (f"batch_{i}.jpg", jpg((i * 5 % 255, 50, 120), (800, 600)), "image/jpeg")) for i in range(25)]
    up = admin.post(f"{BASE_URL}/api/admin/galleries/{gal['id']}/photos", files=files, timeout=240)
    assert up.status_code == 201, up.text
    assert len(up.json()["photos"]) == 25


# Download-all zip regression
def test_download_zip(admin, gal):
    r = admin.get(f"{BASE_URL}/api/g/{gal['slug']}/download", timeout=120)
    assert r.status_code == 200
    assert r.content[:2] == b"PK"
