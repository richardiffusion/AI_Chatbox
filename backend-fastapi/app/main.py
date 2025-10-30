from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from app.core.config import settings
from app.routes.chat import router as chat_router

# get project root and frontend dist path
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
frontend_dist_path = project_root / "frontend" / "dist"

app = FastAPI(
    title="AI Chatbox Backend",
    description="FastAPI Backend for AI Chatbox",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if frontend_dist_path.exists():
    app.mount("/static", StaticFiles(directory=frontend_dist_path), name="static")
    print(f"📁 Serving static files from: {frontend_dist_path}")

# Include routes
app.include_router(chat_router, prefix="/api/chat")

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "timestamp": "2024-01-01T00:00:00Z",  # Later replace with dynamic time
        "environment": settings.NODE_ENV
    }

@app.get("/")
async def serve_frontend():
    """Serve frontend application"""
    index_path = frontend_dist_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend not built yet"}

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """Catch all routes and return frontend app (for SPA)"""
    # Exclude API routes
    if full_path.startswith("api/"):
        return {"error": "API route not found"}

    # If the request is for a static file and it exists, return the file
    static_file_path = frontend_dist_path / full_path
    if static_file_path.exists() and static_file_path.is_file():
        return FileResponse(static_file_path)

    # Otherwise return the frontend app
    index_path = frontend_dist_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    return {"message": "Frontend not available"}