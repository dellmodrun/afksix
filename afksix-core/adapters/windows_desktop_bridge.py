"""Local Windows capture/input bridge. Requires Pillow and an explicit capture area.

Run without --arm to verify capture. --arm allows short key inputs only while
the configured target window is in the foreground. Never bind this to a LAN IP.
"""
import argparse
import base64
import ctypes
import io
import json
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from PIL import ImageChops, ImageGrab, ImageStat


KEYS = {"up": 0x11, "down": 0x1F, "left": 0x1E, "right": 0x20, "brake": 0x39}
KEYEVENTF_SCANCODE = 0x0008
KEYEVENTF_KEYUP = 0x0002


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", ctypes.c_ushort), ("wScan", ctypes.c_ushort),
                ("dwFlags", ctypes.c_ulong), ("time", ctypes.c_ulong),
                ("dwExtraInfo", ctypes.c_void_p)]


class INPUTUNION(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT)]


class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong), ("union", INPUTUNION)]


def send_scan(scan_code, up=False):
    item = INPUT(type=1, union=INPUTUNION(ki=KEYBDINPUT(
        wVk=0, wScan=scan_code,
        dwFlags=KEYEVENTF_SCANCODE | (KEYEVENTF_KEYUP if up else 0),
        time=0, dwExtraInfo=None)))
    if ctypes.windll.user32.SendInput(1, ctypes.byref(item), ctypes.sizeof(INPUT)) != 1:
        raise OSError("Windows SendInput failed")


def foreground_title():
    user32 = ctypes.windll.user32
    title = ctypes.create_unicode_buffer(512)
    user32.GetWindowTextW(user32.GetForegroundWindow(), title, len(title))
    return title.value


def capture(bbox):
    return ImageGrab.grab(bbox=bbox).convert("RGB")


def hold_key(action, duration_ms):
    if action == "none":
        time.sleep(duration_ms / 1000)
        return
    scan = KEYS[action]
    send_scan(scan)
    try:
        time.sleep(duration_ms / 1000)
    finally:
        send_scan(scan, up=True)


class State:
    def __init__(self, bbox, window_title, armed=False, capture_fn=capture,
                 input_fn=hold_key, foreground_fn=foreground_title):
        self.bbox = bbox
        self.window_title = window_title
        self.armed = armed
        self.capture_fn = capture_fn
        self.input_fn = input_fn
        self.foreground_fn = foreground_fn
        self.tick = 0
        self.lock = threading.Lock()


def create_server(state, port=4788):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            print("bridge:", fmt % args)

        def reply(self, status, value):
            body = json.dumps(value).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path == "/health":
                return self.reply(200, {"ok": True, "adapter": "frame", "version": 1, "armed": state.armed})
            if self.path != "/v1/observation":
                return self.reply(404, {"error": "not found"})
            try:
                with state.lock:
                    frame = state.capture_fn(state.bbox)
                    data = io.BytesIO()
                    frame.save(data, format="JPEG", quality=68, optimize=True)
                    observation = {"kind": "frame", "tick": state.tick,
                                   "timestamp": datetime.now(timezone.utc).isoformat(),
                                   "frame": {"mime": "image/jpeg",
                                             "base64": base64.b64encode(data.getvalue()).decode("ascii")}}
                return self.reply(200, observation)
            except Exception as error:
                return self.reply(500, {"error": str(error)})

        def do_POST(self):
            if self.path != "/v1/action":
                return self.reply(404, {"error": "not found"})
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 2048:
                return self.reply(413, {"error": "invalid body size"})
            try:
                data = json.loads(self.rfile.read(length))
                action = data.get("action", {})
                button = action.get("action")
                duration = action.get("duration_ms")
                if button not in (*KEYS, "none") or not isinstance(duration, int) or not 50 <= duration <= 500:
                    return self.reply(422, {"error": "invalid bounded action"})
                with state.lock:
                    if data.get("expected_tick") != state.tick:
                        return self.reply(409, {"error": "stale observation"})
                    if not state.armed:
                        return self.reply(403, {"error": "bridge is not armed"})
                    title = state.foreground_fn()
                    if state.window_title.lower() not in title.lower():
                        return self.reply(403, {"error": "target window is not foreground"})
                    before = state.capture_fn(state.bbox)
                    # Consume the tick before sending input so a failed response
                    # cannot cause the same key action to be replayed blindly.
                    state.tick += 1
                    state.input_fn(button, duration)
                    try:
                        after = state.capture_fn(state.bbox)
                        delta = ImageStat.Stat(ImageChops.difference(before, after)).mean
                        visual_delta = round(sum(delta) / len(delta), 2)
                    except Exception:
                        visual_delta = None
                    return self.reply(200, {"ok": True, "tick": state.tick,
                                             "outcome": f"input delivered to {title}; visual delta {visual_delta if visual_delta is not None else 'unavailable'}",
                                             "visual_delta": visual_delta})
            except Exception as error:
                return self.reply(500, {"error": str(error)})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    parser = argparse.ArgumentParser(description="Local Windows frame and keyboard bridge")
    parser.add_argument("--bbox", required=True, help="x,y,width,height screen rectangle")
    parser.add_argument("--window-title", required=True, help="required substring of the foreground game window title")
    parser.add_argument("--port", type=int, default=4788)
    parser.add_argument("--arm", action="store_true", help="permit bounded keyboard input to the matching foreground window")
    args = parser.parse_args()
    try:
        x, y, width, height = map(int, args.bbox.split(","))
        if width < 100 or height < 100:
            raise ValueError("capture rectangle is too small")
    except ValueError as error:
        parser.error(f"invalid --bbox: {error}")
    state = State((x, y, x + width, y + height), args.window_title, args.arm)
    server = create_server(state, args.port)
    print(f"afksix Windows bridge on http://127.0.0.1:{args.port} / armed={args.arm}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
