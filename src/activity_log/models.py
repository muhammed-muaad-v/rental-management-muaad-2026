
from django.db import models


class Activity(models.Model):
    ACTION_CHOICES = [
        ("create", "Created"),
        ("update", "Updated"),
        ("delete", "Deleted"),
        ("login", "Login"),
        ("logout", "Logout"),
    ]

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
    )
    category = models.CharField(max_length=100)
    description = models.TextField()
    user = models.CharField(
        max_length=150,
        blank=True,
        default="System",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.description}"



