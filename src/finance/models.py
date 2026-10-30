from django.db import models
from customers.models import Customer
from rentals.models import Rental


class Payment(models.Model):

    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("bank", "Bank Transfer"),
        ("card", "Card"),
    ]

    rental = models.ForeignKey(
        Rental,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="cash"
    )

    payment_date = models.DateTimeField(
        auto_now_add=True
    )

    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.customer.name} - ₹{self.amount}"


class Expense(models.Model):

    title = models.CharField(max_length=200)

    category = models.CharField(
        max_length=100,
        default="Other"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    expense_date = models.DateField()

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title