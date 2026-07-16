from pydantic import BaseModel


class LoginData(BaseModel):
    email: str
    password: str


class RegistrationData(BaseModel):
    name: str
    email: str
    password: str

