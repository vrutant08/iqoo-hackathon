"""
ProtoPatch API URL Routing
"""
from django.urls import path
from . import views

urlpatterns = [
    path("sketch2stack/", views.Sketch2StackView.as_view(), name="sketch2stack"),
    path("sketch2stack/refine/", views.Sketch2StackRefineView.as_view(), name="sketch2stack-refine"),
    path("sketch2stack/export-zip/", views.Sketch2StackExportZipView.as_view(), name="sketch2stack-export-zip"),
    path("screentopatch/", views.ScreenToPatchView.as_view(), name="screentopatch"),
    path("health/", views.HealthCheckView.as_view(), name="health"),
]
