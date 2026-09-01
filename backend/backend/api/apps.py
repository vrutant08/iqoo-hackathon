"""Django AppConfig for the ProtoPatch API app."""
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
    verbose_name = "ProtoPatch API"
