"""Compatibility helpers for third-party libraries on newer Python versions."""

from __future__ import annotations

import sys
from typing import Any

_PATCHED = False


def ensure_sqlalchemy_typing_compat() -> None:
    """Patch SQLAlchemy typing helpers when running on Python 3.13+.

    Python 3.13 removed support for subscripting ``typing.Union`` directly,
    which SQLAlchemy <2.0.38 still relies on. The fallback below emulates the
    previous behavior by manually building ``types.UnionType`` chains when the
    stock helper raises ``TypeError``.
    """

    global _PATCHED
    if _PATCHED or sys.version_info < (3, 13):
        return

    from sqlalchemy.util import typing as sa_typing

    original_make_union_type = sa_typing.make_union_type

    def _patched_make_union_type(*types: Any) -> Any:
        try:
            return original_make_union_type(*types)
        except TypeError:
            union = types[0]
            for next_type in types[1:]:
                union = union | next_type  # type: ignore[operator]
            return union

    sa_typing.make_union_type = _patched_make_union_type  # type: ignore[assignment]
    _PATCHED = True