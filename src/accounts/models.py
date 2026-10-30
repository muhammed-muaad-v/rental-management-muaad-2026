from django.conf import settings
from django.db import models


class MemberProfile(models.Model):

    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("shopkeeper", "Shopkeeper"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_profile",
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="shopkeeper",
    )

    def __str__(self):
        return self.user.get_full_name() or self.user.username