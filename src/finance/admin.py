from django.contrib import admin
from .models import Payment, Expense


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "rental",
        "amount",
        "payment_method",
        "payment_date",
    )

    list_filter = (
        "payment_method",
        "payment_date",
    )

    search_fields = (
        "customer__name",
    )


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "amount",
        "expense_date",
        "created_at",
    )

    list_filter = ("expense_date",)

    search_fields = ("title",)