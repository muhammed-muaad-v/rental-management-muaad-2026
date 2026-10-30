from django.urls import path

from .views import (
    RentalListCreateAPIView,
    RentalDetailAPIView,
    RentalItemListCreateAPIView,
    RentalItemDetailAPIView,
    RentalReturnListCreateAPIView,
    RentalReturnDetailAPIView,
)


urlpatterns = [

    path(
        "rentals/",
        RentalListCreateAPIView.as_view(),
        name="rental-list"
    ),

    path(
        "rentals/<int:pk>/",
        RentalDetailAPIView.as_view(),
        name="rental-detail"
    ),

    path(
        "rental-items/",
        RentalItemListCreateAPIView.as_view(),
        name="rental-item-list"
    ),

    path(
        "rental-items/<int:pk>/",
        RentalItemDetailAPIView.as_view(),
        name="rental-item-detail"
    ),

    path(
        "rental-returns/",
        RentalReturnListCreateAPIView.as_view(),
        name="rental-return-list"
    ),

    path(
        "rental-returns/<int:pk>/",
        RentalReturnDetailAPIView.as_view(),
        name="rental-return-detail"
    ),
]