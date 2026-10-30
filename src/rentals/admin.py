from django.contrib import admin

from .models import (
    Rental,
    RentalItem,
    RentalReturn,
)


@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):

    list_display = (
        "customer",
        "site_name",
        "rental_date",
        "total_amount",
        "actual_return_date",
        "status",
    )

    list_filter = (
        "status",
        "rental_date",
    )

    search_fields = (
        "customer__name",
        "site_name",
    )


@admin.register(RentalItem)
class RentalItemAdmin(admin.ModelAdmin):

    list_display = (
        "rental",
        "equipment",
        "quantity",
        "returned_quantity",
        "daily_rent",
    )

    search_fields = (
        "equipment__name",
        "rental__customer__name",
    )


@admin.register(RentalReturn)
class RentalReturnAdmin(admin.ModelAdmin):

    list_display = (
        "rental_item",
        "quantity",
        "return_date",
        "created_at",
    )

    list_filter = (
        "return_date",
    )

    search_fields = (
        "rental_item__equipment__name",
        "rental_item__rental__customer__name",
    )