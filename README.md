This is an easy and convenient Ai chatbox that you can connect to major ai models directly with a working api.

This project is based on React + Vite and JavaScript, with dual backend support (Node.js/Express and Python/FastAPI). Contact richard.yiqun.li@outlook.com for any questions related.

## Functional Features
- Real-time live chat with AI models
- Standalone Product with Front and Back-end
- **Dual Backend Support**: Choose between Node.js/Express and Python/FastAPI
- Model Prompts Customization (check .env.example file in backend folder)
- Tailwind CSS templates
- Easy to re-model and plug in to your own website

## Installation and Operation

### Frontend (Same for both backends)
1. Install Requirements
```bash
cd frontend
npm install
```

### Backend (Choose One)
Option 1: Node.js Backend
```bash
cd backend-nodejs
npm install

# Development
npm run dev

# Production
npm start
```

Option 2: Python FastAPI Backend(v1.3.0 update)
```bash
cd backend-fastapi

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run
python run.py
```

## Environment Settings(API)
Please check .env.example files in respective backend folders:
- `backend-nodejs/.env.example` for Node.js version
- `backend-fastapi/.env.example` for FastAPI version

Note: Both backends provide identical API interfaces, so you can switch between them without changing your frontend code.

## Main Page
<img width="1785" height="1834" alt="image" src="https://github.com/user-attachments/assets/b12e567d-0b55-4529-8bc4-3ba064b5993b" />

### Customized Avatar
v1.1.0 updated
Now you can customize avatar in the frontend/image folder. Make sure to upload picture with name "avatar.jpg".

### Customized Response
With default or customized model prompts, you can setup the model with own config answers.

<img width="1681" height="1168" alt="image" src="https://github.com/user-attachments/assets/84dbabd7-0bbf-46d6-b1e5-4c68fb84bc61" />

#### Note: 
Default model - deepseek-chat
Default prompts - 
``` .env.example
# DEEPSEEK_PROMPT=You are a helpful AI assistant specializing in deep reasoning and analytical thinking.
# CREATIVE_PROMPT=You are a creative writing assistant. Be imaginative, expressive, and engaging.
# TECHNICAL_PROMPT=You are a technical expert. Provide clear, practical solutions with code examples.
# GENERAL_PROMPT=You are a helpful, friendly AI assistant. Provide balanced, informative responses.
```

You can choose your desirable AI model from this drop-down menu. (In order to set up these models please check MODEL_PROMPTS in ChatPage.jsx)
<img width="436" height="410" alt="image" src="https://github.com/user-attachments/assets/079483b4-72eb-4256-86d0-4ae81a228bc5" />

## Example with Long-text Response
<img width="1417" height="1508" alt="image" src="https://github.com/user-attachments/assets/a546de85-194c-4816-95ea-66f6f6c74e44" />
