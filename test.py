import smtplib

EMAIL = "moviecineverse44@gmail.com"
PASSWORD = "guem kfjb aaao hvkm"

server = smtplib.SMTP("smtp.gmail.com", 587)
server.ehlo()
server.starttls()
server.ehlo()

server.login(EMAIL, PASSWORD)
print("Login Successful!")

server.quit()