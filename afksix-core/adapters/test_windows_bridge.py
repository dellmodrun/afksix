import json
import threading
import unittest
import urllib.error
import urllib.request

from PIL import Image
from windows_desktop_bridge import State, create_server


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.color = [10]
        self.actions = []
        def capture(_bbox):
            return Image.new("RGB", (120, 100), (self.color[0], 20, 30))
        def send(button, duration):
            self.actions.append((button, duration))
            self.color[0] = 60
        self.state = State((0, 0, 120, 100), "GTA VI", armed=False,
                           capture_fn=capture, input_fn=send,
                           foreground_fn=lambda: "GTA VI - test window")
        self.server = create_server(self.state, 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, path, payload=None):
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(self.url + path, data=data,
                                         headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(request) as response:
            return json.load(response)

    def test_capture_and_armed_input(self):
        self.assertEqual(self.request("/health")["adapter"], "frame")
        first = self.request("/v1/observation")
        self.assertEqual(first["frame"]["mime"], "image/jpeg")
        body = {"expected_tick": 0, "action": {"action": "up", "duration_ms": 100}}
        with self.assertRaises(urllib.error.HTTPError) as denied:
            self.request("/v1/action", body)
        self.assertEqual(denied.exception.code, 403)
        denied.exception.close()
        self.assertEqual(self.actions, [])
        self.state.armed = True
        result = self.request("/v1/action", body)
        self.assertTrue(result["ok"])
        self.assertEqual(result["tick"], 1)
        self.assertGreater(result["visual_delta"], 0)
        self.assertEqual(self.actions, [("up", 100)])
        with self.assertRaises(urllib.error.HTTPError) as stale:
            self.request("/v1/action", body)
        self.assertEqual(stale.exception.code, 409)
        stale.exception.close()


if __name__ == "__main__":
    unittest.main()
