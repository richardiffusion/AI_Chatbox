import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # 服务器配置
    PORT: int = int(os.getenv("PORT", 8000))
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # AI API 配置
    MOCK_MODE: bool = os.getenv("MOCK_MODE", "false").lower() == "true"
    
    # DeepSeek 配置
    DEEPSEEK_API_URL: str = os.getenv("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    
    # OpenAI 配置
    OPENAI_API_URL: str = os.getenv("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    # Anthropic 配置
    ANTHROPIC_API_URL: str = os.getenv("ANTHROPIC_API_URL", "https://api.anthropic.com/v1/messages")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")
    
    # 提示词配置
    DEEPSEEK_PROMPT: str = os.getenv("DEEPSEEK_PROMPT", "You are a helpful AI assistant specializing in deep reasoning and analytical thinking.")
    CREATIVE_PROMPT: str = os.getenv("CREATIVE_PROMPT", "You are a creative writing assistant. Be imaginative, expressive, and engaging.")
    TECHNICAL_PROMPT: str = os.getenv("TECHNICAL_PROMPT", "You are a technical expert. Provide clear, practical solutions with code examples.")
    GENERAL_PROMPT: str = os.getenv("GENERAL_PROMPT", "You are a helpful, friendly AI assistant. Provide balanced, informative responses.")

settings = Settings()