import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def ensure_mysql_charset(database_url: str) -> str:
	if not database_url.startswith("mysql+pymysql://"):
		return database_url

	parts = urlsplit(database_url)
	query = dict(parse_qsl(parts.query, keep_blank_values=True))
	query.setdefault("charset", "utf8mb4")
	return urlunsplit(parts._replace(query=urlencode(query)))


def get_database_url() -> str:
	database_url = os.getenv("DATABASE_URL")
	if database_url:
		return ensure_mysql_charset(database_url)

	user = os.getenv("MYSQL_USER", "root")
	password = os.getenv("MYSQL_PASSWORD", "123456")
	host = os.getenv("MYSQL_HOST", "127.0.0.1")
	port = os.getenv("MYSQL_PORT", "3306")
	database = os.getenv("MYSQL_DB", "qlns")
	return ensure_mysql_charset(f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}")
