import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def get_database_url() -> str:
	database_url = os.getenv("DATABASE_URL")
	if database_url:
		return database_url

	user = os.getenv("MYSQL_USER", "root")
	password = os.getenv("MYSQL_PASSWORD", "123456")
	host = os.getenv("MYSQL_HOST", "127.0.0.1")
	port = os.getenv("MYSQL_PORT", "3306")
	database = os.getenv("MYSQL_DB", "qlns")
	return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"
