from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from app.core.config import settings
from app.routes.chat import router as chat_router

# 获取前端静态文件路径
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
frontend_dist_path = project_root / "frontend" / "dist"

app = FastAPI(
    title="AI Chatbox Backend",
    description="FastAPI Backend for AI Chatbox",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 为了兼容性，允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件
if frontend_dist_path.exists():
    app.mount("/static", StaticFiles(directory=frontend_dist_path), name="static")
    print(f"📁 Serving static files from: {frontend_dist_path}")

# 包含路由
app.include_router(chat_router, prefix="/api/chat")

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "timestamp": "2024-01-01T00:00:00Z",  # 稍后替换为动态时间
        "environment": settings.NODE_ENV
    }

@app.get("/")
async def serve_frontend():
    """服务前端应用"""
    index_path = frontend_dist_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend not built yet"}

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """捕获所有路由并返回前端应用（用于 SPA）"""
    # 排除 API 路由
    if full_path.startswith("api/"):
        return {"error": "API route not found"}
    
    # 如果请求的是静态文件且存在，返回文件
    static_file_path = frontend_dist_path / full_path
    if static_file_path.exists() and static_file_path.is_file():
        return FileResponse(static_file_path)
    
    # 否则返回前端应用
    index_path = frontend_dist_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    return {"message": "Frontend not available"}