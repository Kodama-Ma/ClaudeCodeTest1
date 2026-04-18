#!/usr/bin/env python3
import csv
import io
import json
import os
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = 3001
CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "books.csv")
FIELDS = ["id", "title", "author", "genre", "rating", "read_date", "memo"]
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")

MIME = {".html": "text/html", ".css": "text/css", ".js": "application/javascript"}


def ensure_csv():
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=FIELDS).writeheader()


def read_books():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_books(books):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(books)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(fmt % args)

    def send_json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, path):
        if path == "/":
            path = "/index.html"
        ext = os.path.splitext(path)[1]
        file_path = os.path.join(PUBLIC_DIR, path.lstrip("/"))
        if not os.path.isfile(file_path):
            self.send_error(404)
            return
        with open(file_path, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/books":
            self.send_json(200, read_books())
        else:
            self.serve_static(parsed.path)

    def do_POST(self):
        if urlparse(self.path).path != "/api/books":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))

        title = (body.get("title") or "").strip()
        author = (body.get("author") or "").strip()
        if not title or not author:
            self.send_json(400, {"error": "title と author は必須です"})
            return
        try:
            rating = int(body.get("rating", 3))
            assert 1 <= rating <= 5
        except (ValueError, AssertionError):
            self.send_json(400, {"error": "rating は1〜5の整数です"})
            return

        new_book = {
            "id": str(uuid.uuid4()),
            "title": title,
            "author": author,
            "genre": (body.get("genre") or "").strip(),
            "rating": rating,
            "read_date": (body.get("read_date") or "").strip(),
            "memo": (body.get("memo") or "").strip(),
        }
        books = read_books()
        books.append(new_book)
        write_books(books)
        self.send_json(201, new_book)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if not path.startswith("/api/books/"):
            self.send_error(404)
            return
        book_id = path[len("/api/books/"):]
        books = read_books()
        filtered = [b for b in books if b["id"] != book_id]
        if len(filtered) == len(books):
            self.send_json(404, {"error": "見つかりません"})
            return
        write_books(filtered)
        self.send_json(200, {"success": True})


if __name__ == "__main__":
    ensure_csv()
    server = HTTPServer(("", PORT), Handler)
    print(f"Book Manager: http://localhost:{PORT}")
    server.serve_forever()
