from django.urls import path

from .views import (
    CustomerListCreateAPIView,
    CustomerDetailAPIView,
)


urlpatterns = [
    path(
        "customers/",
        CustomerListCreateAPIView.as_view(),
        name="customer-list",
    ),

    path(
        "customers/<int:pk>/",
        CustomerDetailAPIView.as_view(),
        name="customer-detail",
    ),
]