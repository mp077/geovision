"""Test script for the GeoVision AI backend endpoints."""
import urllib.request, io, json, sys, base64
from PIL import Image, ImageDraw

BASE = "http://localhost:8000/api/v1"

def test_health():
    r = urllib.request.urlopen(f"{BASE}/health")
    d = json.loads(r.read())
    assert d["status"] == "ok", f"Health failed: {d}"
    print("[OK] /health")

def test_model_status():
    r = urllib.request.urlopen(f"{BASE}/model/status")
    d = json.loads(r.read())
    print(f"[OK] /model/status: classifier={d['classifier']} detector={d['detector']}")

def test_history():
    r = urllib.request.urlopen(f"{BASE}/history")
    d = json.loads(r.read())
    print(f"[OK] /history: {d['total']} records")

def make_test_image_bytes():
    img = Image.new('RGB', (400, 300), color=(170, 155, 140))
    draw = ImageDraw.Draw(img)
    pts = [(180, 80), (300, 60), (360, 160), (320, 240), (200, 260), (120, 200)]
    draw.polygon(pts, fill=(100, 88, 76))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    buf.seek(0)
    return buf.read()

def test_identify_model_unavailable():
    img_bytes = make_test_image_bytes()
    boundary = b'GeoVisionBnd'
    body = (
        b'--' + boundary + b'\r\n'
        b'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
        b'Content-Type: image/jpeg\r\n\r\n'
        + img_bytes +
        b'\r\n--' + boundary + b'--\r\n'
    )
    req = urllib.request.Request(
        f"{BASE}/identify",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary.decode()}"}
    )
    try:
        r = urllib.request.urlopen(req)
        d = json.loads(r.read())
        print(f"[OK] /identify: status={d.get('status')} class={d.get('predicted_class')}")
    except urllib.error.HTTPError as e:
        d = json.loads(e.read())
        if e.code == 503 and d.get("status") == "model_unavailable":
            print("[OK] /identify: 503 model_unavailable (expected - no trained model yet)")
        else:
            print(f"[FAIL] /identify: HTTP {e.code}: {d}")
            sys.exit(1)

def test_detect():
    img = Image.new('RGB', (640, 480), color=(200, 195, 190))
    draw = ImageDraw.Draw(img)
    pts = [(270, 140), (380, 120), (430, 200), (410, 290), (330, 330), (230, 300), (200, 220)]
    draw.polygon(pts, fill=(80, 72, 65), outline=(50, 45, 40))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode()
    payload = json.dumps({"frame": "data:image/jpeg;base64," + b64}).encode()
    req = urllib.request.Request(
        f"{BASE}/scanner/detect",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req)
    d = json.loads(r.read())
    boxes = d.get("boxes", [])
    print(f"[OK] /scanner/detect: {len(boxes)} box(es), latency={d.get('latency_ms')}ms")
    for b in boxes:
        print(f"     class={b.get('class_name')} conf={b.get('confidence'):.2f} x={b['x']} y={b['y']} w={b['width']} h={b['height']}")
    assert d["status"] == "success", "detect status not success"
    assert len(boxes) >= 1, "Expected at least 1 detection box for test rock image"

if __name__ == "__main__":
    print("GeoVision AI Backend Tests\n")
    test_health()
    test_model_status()
    test_history()
    test_identify_model_unavailable()
    test_detect()
    print("\nAll tests passed.")
