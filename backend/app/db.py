"""Database helpers for SQLAlchemy setup."""

from __future__ import annotations

from flask import Flask, current_app
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker

from .config import AppConfig


class Base(DeclarativeBase):
    """Base declarative class for all ORM models."""


def init_db(app: Flask, config: AppConfig) -> Engine:
    """Initialize SQLAlchemy engine and session factory for the app."""
    engine = create_engine(config.database_url, future=True, echo=False)
    session_factory = scoped_session(
        sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    )

    app.config["DB_ENGINE"] = engine
    app.config["DB_SESSION"] = session_factory

    @app.teardown_appcontext
    def shutdown_session(_: BaseException | None = None) -> None:  # pragma: no cover
        session_factory.remove()

    return engine


def get_session(flask_app: Flask | None = None):
    """Return the current scoped session."""
    app_context = flask_app or current_app
    session_factory: scoped_session | None = app_context.config.get("DB_SESSION")
    if session_factory is None:
        raise RuntimeError("Session factory is not initialized")
    return session_factory()


__all__ = ["Base", "init_db", "get_session"]
