import hashlib
import hmac
import os
from base64 import b64decode, b64encode


PASSWORD_HASH_PREFIX = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 390_000
PASSWORD_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = os.urandom(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return "$".join(
        [
            PASSWORD_HASH_PREFIX,
            str(PASSWORD_HASH_ITERATIONS),
            b64encode(salt).decode("ascii"),
            b64encode(digest).decode("ascii"),
        ]
    )


def is_password_hash(value: str | None) -> bool:
    return bool(value and value.startswith(f"{PASSWORD_HASH_PREFIX}$"))


def verify_password(password: str, stored_password: str | None) -> bool:
    if not stored_password:
        return False
    if not is_password_hash(stored_password):
        return hmac.compare_digest(password, stored_password)

    try:
        _, iterations, salt, expected_digest = stored_password.split("$", 3)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            b64decode(salt.encode("ascii")),
            int(iterations),
        )
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(b64encode(digest).decode("ascii"), expected_digest)
