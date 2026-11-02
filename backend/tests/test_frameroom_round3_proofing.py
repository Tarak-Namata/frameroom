# Frameroom round 3: proofing (hearts, limits, comments, submit, reopen, CSV, notifications)
import io
import os
import uuid

import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
OWNER = {"email": "owner@frameroom.dev", "password": "frameroom123"}


def img(color):
    b = io.BytesIO()
    Image.new("RGB", (400, 300), color).save(b, "JPEG")
    return b.getvalue()


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=OWNER)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code}")
    return s


@pytest.fixture(scope="module")
def gal(admin):
    r = admin.post(f"{BASE_URL}/api/admin/galleries", json={"title": "TEST_proof_api"})
    assert r.status_code == 201, r.text
    g = r.json()
    files = [("files", (f"p{i}.jpg", img((i * 60, 100, 50)), "image/jpeg")) for i in range(4)]
    up = admin.post(f"{BASE_URL}/api/admin/galleries/{g['id']}/photos", files=files, timeout=120)
    assert up.status_code == 201, up.text
    g["photos"] = up.json()["photos"]
    yield g
    admin.delete(f"{BASE_URL}/api/admin/galleries/{g['id']}")


def client(gal, email=None, name="TEST Client"):
    s = requests.Session()
    email = email or f"test_{uuid.uuid4().hex[:6]}@x.dev"
    r = s.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing", json={"name": name, "email": email})
    assert r.status_code == 200, r.text
    return s, email


def heart(s, gal, i, on=True):
    return s.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/{gal['photos'][i]['id']}", json={"hearted": on})


# Max selections validation
class TestMaxSelections:
    @pytest.mark.parametrize("bad", ["abc", 0, -1, 2.5, "1.5", 100000])
    def test_invalid(self, admin, gal, bad):
        r = admin.patch(f"{BASE_URL}/api/admin/galleries/{gal['id']}", json={"maxSelections": bad})
        assert r.status_code == 400
        assert "whole number" in r.json().get("error", r.text)

    def test_set_and_clear(self, admin, gal):
        r = admin.patch(f"{BASE_URL}/api/admin/galleries/{gal['id']}", json={"maxSelections": "2"})
        assert r.status_code == 200 and r.json()["maxSelections"] == 2
        assert admin.get(f"{BASE_URL}/api/admin/galleries/{gal['id']}").json()["maxSelections"] == 2
        r = admin.patch(f"{BASE_URL}/api/admin/galleries/{gal['id']}", json={"maxSelections": ""})
        assert r.json()["maxSelections"] is None


# Identity
class TestIdentity:
    def test_requires_identity(self, gal):
        r = requests.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/{gal['photos'][0]['id']}", json={"hearted": True})
        assert r.status_code == 401

    def test_bad_identity(self, gal):
        assert requests.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing", json={"name": "", "email": "a@b.co"}).status_code == 400
        assert requests.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing", json={"name": "A", "email": "nope"}).status_code == 400

    def test_same_email_reattaches(self, gal):
        s1, email = client(gal)
        assert heart(s1, gal, 1).status_code == 200
        s2 = requests.Session()
        d = s2.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing", json={"name": "Other", "email": email.upper()}).json()
        assert [i["photoId"] for i in d["me"]["items"] if i["hearted"]] == [gal["photos"][1]["id"]]
        g = s1.get(f"{BASE_URL}/api/g/{gal['slug']}/proofing").json()
        assert g["me"]["email"] == email


# Limits, comments, submit, reopen, CSV, notifications
class TestFlow:
    def test_full_flow(self, admin, gal):
        admin.patch(f"{BASE_URL}/api/admin/galleries/{gal['id']}", json={"maxSelections": 2})
        s, email = client(gal, name="TEST Limit")
        assert heart(s, gal, 0).json()["count"] == 1
        assert heart(s, gal, 1).json()["count"] == 2
        r = heart(s, gal, 2)
        assert r.status_code == 409 and "limit" in r.json()["error"]
        assert heart(s, gal, 1, False).json()["count"] == 1
        assert heart(s, gal, 2).json()["count"] == 2
        # comment on non-hearted photo + on hearted with comma/quote
        c = s.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/{gal['photos'][3]['id']}", json={"comment": "Nice light"})
        assert c.status_code == 200 and c.json()["hearted"] is False and c.json()["comment"] == "Nice light"
        s.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/{gal['photos'][0]['id']}", json={"comment": 'Crop, "tight"'})
        assert s.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/{gal['photos'][0]['id']}", json={"comment": "x" * 501}).status_code == 400
        # submit
        r = s.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing/submit")
        assert r.status_code == 200 and r.json()["message"] == "Selections submitted. Your photographer has been notified."
        assert "email" not in r.text.lower()
        assert s.get(f"{BASE_URL}/api/g/{gal['slug']}/proofing").json()["me"]["status"] == "submitted"
        assert heart(s, gal, 3).status_code == 409
        # notifications
        n = admin.get(f"{BASE_URL}/api/admin/notifications").json()
        mine = [x for x in n if x["galleryId"] == gal["id"] and x["clientName"] == "TEST Limit"]
        assert mine and mine[0]["count"] == 2
        sel_id = mine[0]["id"]
        # selections list marks read
        d = admin.get(f"{BASE_URL}/api/admin/galleries/{gal['id']}/selections").json()
        sel = [x for x in d["selections"] if x["id"] == sel_id][0]
        assert sel["status"] == "submitted" and len([i for i in sel["items"] if i["hearted"]]) == 2
        assert any(i["comment"] == "Nice light" and not i["hearted"] for i in sel["items"])
        n2 = admin.get(f"{BASE_URL}/api/admin/notifications").json()
        assert not [x for x in n2 if x["id"] == sel_id]
        # CSV
        csv = admin.get(f"{BASE_URL}/api/admin/selections/{sel_id}/csv")
        assert csv.status_code == 200 and "text/csv" in csv.headers["content-type"]
        lines = csv.text.strip().split("\r\n")
        # Round 5 format: selected rows first, then comment-only rows
        assert lines[0] == "filename,selected,comment,client_name,client_email,submitted_at" and len(lines) == 4
        assert lines[1].startswith('p0.jpg,yes,"Crop, ""tight""",')
        assert lines[3].split(",")[1:3] == ["no", "Nice light"]
        assert requests.get(f"{BASE_URL}/api/admin/selections/{sel_id}/csv").status_code == 401
        # reopen
        assert requests.post(f"{BASE_URL}/api/admin/selections/{sel_id}/reopen").status_code == 401
        assert admin.post(f"{BASE_URL}/api/admin/selections/{sel_id}/reopen").status_code == 200
        assert s.get(f"{BASE_URL}/api/g/{gal['slug']}/proofing").json()["me"]["status"] == "open"
        assert heart(s, gal, 2, False).status_code == 200
        # resubmit -> unread again
        assert s.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing/submit").status_code == 200
        assert [x for x in admin.get(f"{BASE_URL}/api/admin/notifications").json() if x["id"] == sel_id]
        admin.get(f"{BASE_URL}/api/admin/galleries/{gal['id']}/selections")

    def test_submit_empty_blocked(self, gal):
        s, _ = client(gal)
        r = s.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing/submit")
        assert r.status_code == 400

    def test_lowered_limit_blocks_submit(self, admin, gal):
        admin.patch(f"{BASE_URL}/api/admin/galleries/{gal['id']}", json={"maxSelections": ""})
        s, _ = client(gal)
        for i in range(4):
            assert heart(s, gal, i).status_code == 200
        admin.patch(f"{BASE_URL}/api/admin/galleries/{gal['id']}", json={"maxSelections": 2})
        r = s.post(f"{BASE_URL}/api/g/{gal['slug']}/proofing/submit")
        assert r.status_code == 400 and "remove 2" in r.json()["error"].lower()

    def test_photo_other_gallery_404(self, gal):
        s, _ = client(gal)
        assert s.put(f"{BASE_URL}/api/g/{gal['slug']}/proofing/items/nonexistent", json={"hearted": True}).status_code == 404

    def test_admin_endpoints_auth(self, gal):
        assert requests.get(f"{BASE_URL}/api/admin/notifications").status_code == 401
        assert requests.get(f"{BASE_URL}/api/admin/galleries/{gal['id']}/selections").status_code == 401
        assert requests.post(f"{BASE_URL}/api/admin/settings/email-banner").status_code == 401


# Password-protected gallery requires unlock before proofing
class TestPasswordGate:
    def test_locked(self, admin):
        g = admin.post(f"{BASE_URL}/api/admin/galleries", json={"title": "TEST_proof_pw", "password": "abcd1"}).json()
        try:
            r = requests.post(f"{BASE_URL}/api/g/{g['slug']}/proofing", json={"name": "A", "email": "a@b.co"})
            assert r.status_code == 404
        finally:
            admin.delete(f"{BASE_URL}/api/admin/galleries/{g['id']}")
