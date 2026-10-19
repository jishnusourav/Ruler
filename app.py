from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class RulerHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    print(f"Ruler System running at http://localhost:{port}")
    print("On the same Wi-Fi, open http://YOUR-COMPUTER-IP:" + str(port) + " on your phone.")
    ThreadingHTTPServer((host, port), RulerHandler).serve_forever()
