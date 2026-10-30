from rest_framework import generics

from .models import Category, Equipment
from .serializers import (
    CategorySerializer,
    EquipmentSerializer,
)


class CategoryListCreateAPIView(
    generics.ListCreateAPIView
):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class CategoryDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class EquipmentListCreateAPIView(
    generics.ListCreateAPIView
):
    queryset = Equipment.objects.all().order_by("name")
    serializer_class = EquipmentSerializer


class EquipmentDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer