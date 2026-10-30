from django.contrib import admin
from .models import Category, Equipment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "total_stock",
        "available_stock",
        "daily_rent",
        "is_active",
    )

    list_filter = ("category", "is_active")

    search_fields = ("name",)
    
    
    
    