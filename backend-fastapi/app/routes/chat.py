from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
import aiohttp
import asyncio
from datetime import datetime

from app.core.config import settings

router = APIRouter()

# AI API 配置（与 Node.js 版本保持一致）
AI_CONFIG = {
    "deepseek": {
        "url": settings.DEEPSEEK_API_URL,
        "key": settings.DEEPSEEK_API_KEY,
        "model": settings.DEEPSEEK_MODEL
    },
    "openai": {
        "url": settings.OPENAI_API_URL,
        "key": settings.OPENAI_API_KEY,
        "model": settings.OPENAI_MODEL
    },
    "anthropic": {
        "url": settings.ANTHROPIC_API_URL,
        "key": settings.ANTHROPIC_API_KEY,
        "model": settings.ANTHROPIC_MODEL
    },
    "general": {
        "url": settings.DEEPSEEK_API_URL,
        "key": settings.DEEPSEEK_API_KEY,
        "model": settings.DEEPSEEK_MODEL
    },
    "creative": {
        "url": settings.DEEPSEEK_API_URL,
        "key": settings.DEEPSEEK_API_KEY,
        "model": settings.DEEPSEEK_MODEL
    },
    "technical": {
        "url": settings.DEEPSEEK_API_URL,
        "key": settings.DEEPSEEK_API_KEY,
        "model": settings.DEEPSEEK_MODEL
    }
}

def get_model_prompts():
    """获取模型提示词（与 Node.js 版本相同逻辑）"""
    env_prompts = {
        "deepseek": settings.DEEPSEEK_PROMPT,
        "creative": settings.CREATIVE_PROMPT,
        "technical": settings.TECHNICAL_PROMPT,
        "general": settings.GENERAL_PROMPT,
    }

    default_prompts = {
        "deepseek": "You are a helpful AI assistant specializing in deep reasoning and analytical thinking.",
        "creative": "You are a creative writing assistant. Be imaginative, expressive, and engaging.",
        "technical": "You are a technical expert. Provide clear, practical solutions with code examples.",
        "general": "You are a helpful, friendly AI assistant. Provide balanced, informative responses.",
    }

    merged_prompts = {}
    for key in default_prompts:
        merged_prompts[key] = env_prompts.get(key) or default_prompts[key]
    
    return merged_prompts

@router.post("/stream")
async def stream_chat(request: dict):
    """流式聊天接口"""
    prompt = request.get("prompt")
    model_type = request.get("model", "general")

    if not prompt:
        async def error_stream():
            yield f"data: {json.dumps({'error': 'Prompt is required'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    # 检查模拟模式
    if settings.MOCK_MODE:
        print(f"🤖 Mock Stream Mode: Using model {model_type} to respond")
        
        mock_responses = {
            "general": f'This is a general response to "{prompt}". Currently using the general assistant mode.',
            "creative": f'🎨 Creative mode response to "{prompt}": Let me answer this question in an imaginative way...',
            "technical": f'⚙️ Technical mode response to "{prompt}": Analyzing this question from a technical perspective...',
            "deepseek": f'🤔 DeepSeek analysis of "{prompt}": Let me answer this with logical reasoning...'
        }
        
        response_text = mock_responses.get(model_type, mock_responses["general"])
        
        async def mock_stream():
            words = list(response_text)
            for i, word in enumerate(words):
                await asyncio.sleep(0.03)  # 模拟打字效果
                yield f"data: {json.dumps({'content': word, 'done': False})}\n\n"
            yield f"data: {json.dumps({'done': True, 'model': model_type, 'timestamp': datetime.now().isoformat()})}\n\n"
        
        return StreamingResponse(
            mock_stream(),
            media_type="text/event-stream",
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        )

    config = AI_CONFIG.get(model_type)
    if not config:
        async def error_stream():
            yield f"data: {json.dumps({'error': f'Unsupported model: {model_type}'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    if not config["key"] or "your_" in config["key"] or config["key"] == "your_deepseek_api_key_here":
        async def error_stream():
            yield f"data: {json.dumps({'error': f'API key for {model_type} is not configured', 'message': 'Please set MOCK_MODE=true or configure API keys in .env file'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    # 获取提示词
    MODEL_PROMPTS = get_model_prompts()
    system_prompt = MODEL_PROMPTS.get(model_type, MODEL_PROMPTS["general"])
    full_prompt = f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:"

    print(f"📝 Stream Mode: Prompt Used ({model_type}): {system_prompt[:100]}...")

    # 流式请求到 AI API
    async def ai_stream():
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {config["key"]}'
            }
            
            payload = {
                "model": config["model"],
                "messages": [{"role": "user", "content": full_prompt}],
                "stream": True,
                "temperature": 0.7,
                "max_tokens": 2000
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(config["url"], json=payload, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        yield f"data: {json.dumps({'error': 'AI API request failed', 'details': error_text})}\n\n"
                        return

                    buffer = ""
                    async for chunk in response.content:
                        buffer += chunk.decode()
                        lines = buffer.split('\n')
                        buffer = lines.pop() if lines else ""
                        
                        for line in lines:
                            if line.startswith('data: ') and '[DONE]' not in line:
                                try:
                                    data = json.loads(line[6:])
                                    content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    if content:
                                        yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                                except json.JSONDecodeError:
                                    continue

                    yield f"data: {json.dumps({'done': True, 'model': model_type, 'timestamp': datetime.now().isoformat()})}\n\n"

        except Exception as error:
            print(f"Stream Error: {error}")
            yield f"data: {json.dumps({'error': 'Stream connection failed', 'details': str(error)})}\n\n"

    return StreamingResponse(
        ai_stream(),
        media_type="text/event-stream",
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    )

@router.post("/")
async def chat(request: dict):
    """非流式聊天接口"""
    print(f"🔧 Receive Chat Request: {request}")
    print(f"🔧 MOCK_MODE: {settings.MOCK_MODE}")
    print(f"🔧 NODE_ENV: {settings.NODE_ENV}")
    
    prompt = request.get("prompt")
    model_type = request.get("model", "general")

    print(f"🔧 Request Model: {model_type}")

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    # 检查模拟模式
    if settings.MOCK_MODE:
        print(f"🤖 Mock Mode: Using model {model_type} to respond")
        mock_responses = {
            "general": f'This is a general response to "{prompt}". Currently using the general assistant mode.',
            "creative": f'🎨 Creative mode response to "{prompt}": Let me answer this question in an imaginative way...',
            "technical": f'⚙️ Technical mode response to "{prompt}": Analyzing this question from a technical perspective...',
            "deepseek": f'🤔 DeepSeek analysis of "{prompt}": Let me answer this with logical reasoning...'
        }
        
        await asyncio.sleep(1)  # 模拟处理时间
        
        return {
            "response": mock_responses.get(model_type, mock_responses["general"]),
            "model": model_type,
            "timestamp": datetime.now().isoformat(),
            "mock": True
        }

    config = AI_CONFIG.get(model_type)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {model_type}")

    # 检查 API 密钥
    if not config["key"] or "your_" in config["key"] or config["key"] == "your_deepseek_api_key_here":
        raise HTTPException(
            status_code=500,
            detail={
                "error": f"API key for {model_type} is not configured",
                "message": "Please set MOCK_MODE=true or configure API keys in .env file"
            }
        )

    # 获取提示词
    MODEL_PROMPTS = get_model_prompts()
    system_prompt = MODEL_PROMPTS.get(model_type, MODEL_PROMPTS["general"])
    full_prompt = f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:"

    print(f"📝 Using prompt ({model_type}): {system_prompt[:100]}...")

    try:
        headers = {
            'Content-Type': 'application/json',
        }

        if model_type == "anthropic":
            headers['x-api-key'] = config["key"]
            headers['anthropic-version'] = '2023-06-01'
            payload = {
                "model": config["model"],
                "max_tokens": 4000,
                "messages": [{"role": "user", "content": full_prompt}]
            }
        else:
            headers['Authorization'] = f'Bearer {config["key"]}'
            payload = {
                "model": config["model"],
                "messages": [{"role": "user", "content": full_prompt}],
                "stream": False
            }

        async with aiohttp.ClientSession() as session:
            async with session.post(config["url"], json=payload, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=error_text)

                response_data = await response.json()

                if model_type == "anthropic":
                    ai_response = response_data["content"][0]["text"]
                else:
                    ai_response = response_data["choices"][0]["message"]["content"]

                return {
                    "response": ai_response,
                    "model": model_type,
                    "timestamp": datetime.now().isoformat()
                }

    except Exception as error:
        print(f"AI API Error: {error}")
        raise HTTPException(status_code=500, detail=f"Failed to get response from AI service: {str(error)}")

@router.get("/models")
async def get_models():
    """获取可用模型"""
    if settings.MOCK_MODE:
        available_models = list(AI_CONFIG.keys())
    else:
        available_models = [
            model for model in AI_CONFIG 
            if AI_CONFIG[model]["key"] and AI_CONFIG[model]["key"] != "your_deepseek_api_key_here"
        ]
    
    MODEL_PROMPTS = get_model_prompts()
    
    return {
        "models": available_models,
        "prompts": MODEL_PROMPTS,
        "mockMode": settings.MOCK_MODE
    }