import re

from pydantic import BaseModel, field_validator


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LoginData(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        normalized = value.strip().lower()

        if len(normalized) > 255 or not EMAIL_PATTERN.fullmatch(normalized):
            raise ValueError("Enter a valid email address")

        return normalized

    @field_validator("password")
    @classmethod
    def validate_login_password(cls, value):
        if not value or len(value) > 1024:
            raise ValueError("Password is required")

        return value


class RegistrationData(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        normalized = value.strip()

        if not normalized:
            raise ValueError("Name is required")

        if len(normalized) > 255:
            raise ValueError("Name must be 255 characters or fewer")

        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        return LoginData.validate_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")

        if len(value) > 1024:
            raise ValueError("Password is too long")

        return value
