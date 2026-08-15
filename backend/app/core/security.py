"""Contraseñas y credenciales de sesión.

Todo se hace con la biblioteca estándar (`hashlib`, `hmac`, `secrets`): no añadimos
dependencias nuevas al despliegue, que es donde más cosas se rompen.

- Las contraseñas se guardan con PBKDF2-HMAC-SHA256 y sal aleatoria. Nunca en claro.
- La credencial de sesión es un texto firmado (HMAC-SHA256) con la clave del servidor:
  el servidor no guarda sesiones, sólo comprueba la firma.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta

HASH_ALGORITHM = "pbkdf2_sha256"
HASH_ITERATIONS = 200_000
SALT_BYTES = 16

# La clave de firma se carga al arrancar (ver `services.auth.ensure_signing_secret`).
_signing_secret: str | None = None


def set_signing_secret(value: str) -> None:
    global _signing_secret
    _signing_secret = value


def signing_secret_is_set() -> bool:
    return _signing_secret is not None


def generate_secret() -> str:
    return secrets.token_urlsafe(48)


# --------------------------------------------------------------------------- #
# Contraseñas
# --------------------------------------------------------------------------- #


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, HASH_ITERATIONS)
    return f"{HASH_ALGORITHM}${HASH_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored.split("$")
        if algorithm != HASH_ALGORITHM:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    # compare_digest: comparación en tiempo constante.
    return hmac.compare_digest(digest.hex(), digest_hex)


# --------------------------------------------------------------------------- #
# Credencial de sesión
# --------------------------------------------------------------------------- #


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(payload: str, secret: str) -> str:
    return _b64encode(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest())


def create_token(*, user_id: str, token_version: int, expires_in_days: int) -> str:
    """Devuelve `payload.firma`. El payload es legible pero no manipulable."""
    if _signing_secret is None:  # pragma: no cover - garantizado por el arranque
        raise RuntimeError("La clave de firma no está cargada")
    body = {
        "sub": user_id,
        "ver": token_version,
        "exp": int((datetime.now(UTC) + timedelta(days=expires_in_days)).timestamp()),
    }
    payload = _b64encode(json.dumps(body, separators=(",", ":")).encode())
    return f"{payload}.{_sign(payload, _signing_secret)}"


def read_token(token: str) -> dict | None:
    """Comprueba firma y caducidad. Devuelve el contenido o `None` si no vale."""
    if _signing_secret is None:  # pragma: no cover - garantizado por el arranque
        return None
    payload, separator, signature = token.partition(".")
    if not separator:
        return None
    if not hmac.compare_digest(signature, _sign(payload, _signing_secret)):
        return None
    try:
        body = json.loads(_b64decode(payload))
    except (ValueError, TypeError):
        return None
    if not isinstance(body, dict) or "sub" not in body:
        return None
    if int(body.get("exp", 0)) < datetime.now(UTC).timestamp():
        return None
    return body
