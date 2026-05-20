from pathlib import Path
import os
import json

TESTS_DIR = Path(__file__).parent
ROOT = TESTS_DIR.parent.parent

SERVICE_DIR_CANDIDATES = [
    ROOT / "apps" / "vis-service",
]

DEFAULT_API_BASE = "http://localhost:8080"
DEFAULT_HEALTH_PATH = "/health"
DEFAULT_BACKEND_CMD = "npm.cmd run dev" if os.name == "nt" else "npm run dev"

_ASSUMPTIONS_PATH = TESTS_DIR / "runtime_assumptions.json"
_ASSUMPTIONS = json.loads(_ASSUMPTIONS_PATH.read_text(encoding="utf-8"))

COMPARISON_ASSUMPTIONS = _ASSUMPTIONS["comparison_assumptions"]
SEMANTIC_ROLES = _ASSUMPTIONS["semantic_roles"]
BENCHMARK_MODE_MATRIX = {
    entry["group"]: entry["modes"] for entry in _ASSUMPTIONS["required_mode_matrix"]
}


def resolve_service_dir() -> Path:
    override = os.getenv("REGRESSION_SERVICE_DIR")
    if override:
        return Path(override)
    return next((p for p in SERVICE_DIR_CANDIDATES if p.exists()), SERVICE_DIR_CANDIDATES[0])


def resolve_backend_cmd() -> list[str]:
    override = os.getenv("REGRESSION_BACKEND_CMD")
    return (override or DEFAULT_BACKEND_CMD).split()


def resolve_api_base(config_api_base: str | None) -> str:
    return config_api_base or os.getenv("REGRESSION_API_BASE") or DEFAULT_API_BASE


def resolve_health_url(api_base: str) -> str:
    path = os.getenv("REGRESSION_HEALTH_PATH") or DEFAULT_HEALTH_PATH
    return f"{api_base.rstrip('/')}{path}"
