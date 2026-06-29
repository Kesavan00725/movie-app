import os
import secrets
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)


# ====================================================
# Function 1 : Welcome Email
# ====================================================

def send_welcome_email(username: str, user_email: str):
    try:
        message = MIMEMultipart("related")
        message["Subject"] = "Welcome to Movie App 🎬"
        message["From"] = EMAIL_ADDRESS
        message["To"] = user_email

        html = f"""
        <html>
        <body>
            <center>
                <img src="cid:logo" width="180">
            </center>

            <h2>Hello {username} 👋</h2>

            <p>Welcome to Movie App.</p>

            <p>Your account has been created successfully.</p>

            <p>Enjoy watching your favourite movies 🍿</p>

        </body>
        </html>
        """

        message.attach(MIMEText(html, "html"))

        image_path = os.path.join(BASE_DIR, "uploads", "logo.png")

        if os.path.exists(image_path):
            with open(image_path, "rb") as img:
                image = MIMEImage(img.read())
                image.add_header("Content-ID", "<logo>")
                message.attach(image)

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT,
            timeout=15
        ) as server:

            server.starttls()
            server.login(
                EMAIL_ADDRESS,
                EMAIL_PASSWORD
            )
            server.send_message(message)

        logger.info(f"Welcome email sent to {user_email}")

    except Exception as e:
        logger.exception(f"Failed to send welcome email: {e}")


# ====================================================
# Function 2 : OTP Email
# ====================================================

def send_otp_email(user_email: str, otp: str):
    try:
        message = MIMEMultipart()
        message["Subject"] = "Movie App OTP Verification"
        message["From"] = EMAIL_ADDRESS
        message["To"] = user_email

        html = f"""
        <html>
        <body>

            <h2>Email Verification</h2>

            <p>Your One Time Password (OTP) is</p>

            <h1 style="color:blue;">
                {otp}
            </h1>

            <p>This OTP is valid for 5 minutes.</p>

            <p>Do not share this OTP with anyone.</p>

        </body>
        </html>
        """

        message.attach(MIMEText(html, "html"))

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT,
            timeout=15
        ) as server:

            server.starttls()
            server.login(
                EMAIL_ADDRESS,
                EMAIL_PASSWORD
            )
            server.send_message(message)

        logger.info(f"OTP email sent to {user_email}")

    except Exception as e:
        logger.exception(f"Failed to send OTP email: {e}")


# ====================================================
# Function 3 : Generate OTP
# ====================================================

def generate_otp():
    return str(secrets.randbelow(900000) + 100000)