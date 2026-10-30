from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Equipment(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="equipment"
    )

    name = models.CharField(max_length=150)

    total_stock = models.PositiveIntegerField(default=0)

    available_stock = models.PositiveIntegerField(default=0)

    daily_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name