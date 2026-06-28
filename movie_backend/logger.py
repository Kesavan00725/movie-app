import logging
import os

os.makedirs("movie_backend/logs", exist_ok=True)

logger = logging.getLogger("movie_backend")
logger.setLevel(logging.INFO)
logger.propagate = False  # Prevent duplicate logs

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(message)s"
)

file_handler = logging.FileHandler("logs/app.log")
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(formatter)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)