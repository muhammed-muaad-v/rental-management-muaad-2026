from django.urls import path
from .views import ActivityListCreateAPIView

urlpatterns = [
    path("", ActivityListCreateAPIView.as_view(), name="activity-list"),
]