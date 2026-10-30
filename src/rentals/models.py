from django.db import models
from django.utils import timezone

from customers.models import Customer
from inventory.models import Equipment


class Rental(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="rentals"
    )

    site_name = models.CharField(max_length=200)

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    rental_date = models.DateField(
        auto_now_add=True
    )

    actual_return_date = models.DateField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def calculate_total_amount(self):

        total = 0

        for rental_item in self.items.all():

            for return_record in rental_item.returns.all():

                days = (
                    return_record.return_date
                    - self.rental_date
                ).days

                # Same-day rental = 1 day
                days = max(days, 1)

                total += (
                    return_record.quantity
                    * rental_item.daily_rent
                    * days
                )

        return total

    def update_total_amount(self):

        self.total_amount = self.calculate_total_amount()

        self.save(
            update_fields=["total_amount"]
        )

    def update_status(self):

        if self.status == "cancelled":
            return

        items = list(
            self.items.all()
        )

        if not items:
            return

        all_items_returned = all(
            item.returned_quantity >= item.quantity
            for item in items
        )

        if all_items_returned:

            self.status = "completed"

            latest_return = (
                RentalReturn.objects
                .filter(
                    rental_item__rental=self
                )
                .order_by(
                    "-return_date",
                    "-id"
                )
                .first()
            )

            if latest_return:

                self.actual_return_date = (
                    latest_return.return_date
                )

            else:

                self.actual_return_date = (
                    timezone.localdate()
                )

        else:

            self.status = "active"
            self.actual_return_date = None

        self.save(
            update_fields=[
                "status",
                "actual_return_date",
            ]
        )

    def __str__(self):

        return (
            f"{self.customer.name} - "
            f"{self.site_name}"
        )


class RentalItem(models.Model):

    rental = models.ForeignKey(
        Rental,
        on_delete=models.CASCADE,
        related_name="items"
    )

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="rental_items"
    )

    quantity = models.PositiveIntegerField()

    daily_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    returned_quantity = models.PositiveIntegerField(
        default=0
    )

    def __str__(self):

        return (
            f"{self.equipment.name} "
            f"× {self.quantity}"
        )


class RentalReturn(models.Model):

    rental_item = models.ForeignKey(
        RentalItem,
        on_delete=models.CASCADE,
        related_name="returns"
    )

    quantity = models.PositiveIntegerField()

    return_date = models.DateField(
        default=timezone.localdate
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.rental_item.equipment.name} "
            f"× {self.quantity} "
            f"returned on {self.return_date}"
        )