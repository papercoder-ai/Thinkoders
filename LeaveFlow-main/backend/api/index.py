"""
Vercel Serverless Function Handler for LeaveFlow API

This file serves as the entry point for Vercel serverless deployment.
Vercel expects the handler to be in the /api directory.
"""

from app.main import app

# Vercel will use this as the ASGI handler
handler = app
