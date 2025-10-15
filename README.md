This is an easy and convenient Ai chatbox that you can connect to major ai models directly with a working api.

This project is based on React + Vite and JavaScript. Contact richard.yiqun.li@outlook.com for any questions related.

## Functional Features
- Real-time live chat with AI models
- Standalone Product with Front and Back-end
- Model Prompts Customization (check .env.example file in backend folder)
- Interactive design
- Tailwind CSS templates
- Easy to re-model and plug in to your own website

## Installation and Operation

1. Install Requirements
``` bash
cd frontend
npm install

cd backend
npm install
```
2. Development Commands
```
cd frontend
npm run dev
```
3. Production Commands
```
cd frontend
npm run build

cd backend
npm start
```

## Environment Settings(API)
Please check .env.example file in backend folder

## Main Page
<img width="1785" height="1834" alt="image" src="https://github.com/user-attachments/assets/b12e567d-0b55-4529-8bc4-3ba064b5993b" />

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
