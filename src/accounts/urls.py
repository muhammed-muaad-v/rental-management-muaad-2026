
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import UserListCreateAPIView, UserDetailAPIView

urlpatterns = [
    path("users/", UserListCreateAPIView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", UserDetailAPIView.as_view(), name="user-detail"),

    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
