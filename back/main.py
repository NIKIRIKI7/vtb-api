from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.events import attach_db_events
from routes import auth, banks, account,chat

app = FastAPI(title="MapTrack API", version="0.1.0")

# Подключение БД и событий
attach_db_events(app)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1:5173",
        "http://localhost:5173"
    ],
    allow_credentials=True,  # 👈 обязательно для передачи cookie (refresh_token)
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(auth.router)
app.include_router(banks.router)
app.include_router(account.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "MapTrack running 🚀"}
