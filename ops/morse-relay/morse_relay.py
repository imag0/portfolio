#!/usr/bin/env python3
import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HOST = os.environ.get("MORSE_RELAY_HOST", "127.0.0.1")
PORT = int(os.environ.get("MORSE_RELAY_PORT", "8765"))
DB_PATH = Path(os.environ.get("MORSE_RELAY_DB", "/var/lib/morse-relay/messages.db"))
ALLOWED_ORIGIN = os.environ.get("MORSE_RELAY_ORIGIN", "*")
MAX_BODY = 8192


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            callsign TEXT NOT NULL,
            morse TEXT NOT NULL,
            translation TEXT NOT NULL,
            cpm REAL NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    db.commit()
    return db


def row_to_message(row):
    return {
        "id": row["id"],
        "callsign": row["callsign"],
        "morse": row["morse"],
        "translation": row["translation"],
        "cpm": row["cpm"],
        "created_at": row["created_at"],
        "time": datetime.fromisoformat(row["created_at"]).strftime("%H:%M:%S"),
    }


class MorseRelay(BaseHTTPRequestHandler):
    server_version = "MorseRelay/1.0"

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} - {fmt % args}")

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/health", "/morse-api/health"):
            self.send_json(200, {"ok": True})
            return

        if parsed.path not in ("/messages", "/morse-api/messages"):
            self.send_json(404, {"error": "not_found"})
            return

        query = parse_qs(parsed.query)
        after = int(query.get("after", ["0"])[0] or "0")
        limit = max(1, min(int(query.get("limit", ["80"])[0] or "80"), 200))
        with connect() as db:
            if after > 0:
                rows = db.execute(
                    "SELECT * FROM messages WHERE id > ? ORDER BY id ASC LIMIT ?",
                    (after, limit),
                ).fetchall()
            else:
                rows = db.execute(
                    "SELECT * FROM messages ORDER BY id DESC LIMIT ?",
                    (limit,),
                ).fetchall()
                rows = list(reversed(rows))
        self.send_json(200, {"messages": [row_to_message(row) for row in rows]})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path not in ("/messages", "/morse-api/messages"):
            self.send_json(404, {"error": "not_found"})
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > MAX_BODY:
            self.send_json(413, {"error": "invalid_body"})
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json(400, {"error": "invalid_json"})
            return

        callsign = str(payload.get("callsign", ""))[:16].strip().upper()
        morse = str(payload.get("morse", ""))[:1000].strip()
        translation = str(payload.get("translation", ""))[:500].strip().upper()
        cpm = float(payload.get("cpm", 0) or 0)
        if not callsign or not any(char in morse for char in ".-"):
            self.send_json(400, {"error": "invalid_message"})
            return

        created_at = datetime.now(timezone.utc).isoformat()
        with connect() as db:
            cursor = db.execute(
                "INSERT INTO messages (callsign, morse, translation, cpm, created_at) VALUES (?, ?, ?, ?, ?)",
                (callsign, morse, translation or "...", cpm, created_at),
            )
            db.commit()
            row = db.execute("SELECT * FROM messages WHERE id = ?", (cursor.lastrowid,)).fetchone()

        self.send_json(201, {"message": row_to_message(row)})


def main():
    connect().close()
    server = ThreadingHTTPServer((HOST, PORT), MorseRelay)
    print(f"Morse relay listening on {HOST}:{PORT}, db={DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
