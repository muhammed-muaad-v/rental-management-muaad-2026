from django.urls import path

from .views import (
    CategoryListCreateAPIView,
    CategoryDetailAPIView,
    EquipmentListCreateAPIView,
    EquipmentDetailAPIView,
)


urlpatterns = [

    path(
        "categories/",
        CategoryListCreateAPIView.as_view(),
        name="category-list"
    ),

    path(
        "categories/<int:pk>/",
        CategoryDetailAPIView.as_view(),
        name="category-detail"
    ),

    path(
        "equipment/",
        EquipmentListCreateAPIView.as_view(),
        name="equipment-list"
    ),

    path(
        "equipment/<int:pk>/",
        EquipmentDetailAPIView.as_view(),
        name="equipment-detail"
    ),
]