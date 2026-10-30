import uuid

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import MemberProfile


User = get_user_model()


class MemberUserSerializer(serializers.Serializer):

    id = serializers.IntegerField(read_only=True)

    name = serializers.CharField(max_length=150)

    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )

    role = serializers.ChoiceField(
        choices=MemberProfile.ROLE_CHOICES,
        required=False,
        default="shopkeeper",
    )

    is_active = serializers.BooleanField(
        required=False,
        default=True,
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    def to_representation(self, instance):
        profile = getattr(instance, "member_profile", None)

        if profile:
            phone = profile.phone
            role = profile.role
        else:
            phone = ""
            role = "owner" if instance.is_superuser else "shopkeeper"

        return {
            "id": instance.id,
            "name": instance.first_name or instance.username,
            "phone": phone,
            "role": role,
            "is_active": instance.is_active,
            "email": instance.email,
        }

    def create(self, validated_data):
        name = validated_data["name"]
        phone = validated_data.get("phone", "")
        role = validated_data.get("role", "shopkeeper")
        is_active = validated_data.get("is_active", True)
        email = validated_data.get("email", "")
        password = validated_data.get("password")

        if not password:
            raise serializers.ValidationError({
                "password": "Password is required when creating a user."
            })

        username = f"member_{uuid.uuid4().hex[:12]}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=name,
            is_active=is_active,
        )

        MemberProfile.objects.create(
            user=user,
            phone=phone,
            role=role,
        )

        return user

    def update(self, instance, validated_data):
        if "name" in validated_data:
            instance.first_name = validated_data["name"]

        if "email" in validated_data:
            instance.email = validated_data["email"]

        if "is_active" in validated_data:
            instance.is_active = validated_data["is_active"]

        password = validated_data.get("password")

        if password:
            instance.set_password(password)

        instance.save()

        profile, _ = MemberProfile.objects.get_or_create(
            user=instance,
            defaults={
                "phone": "",
                "role": "owner" if instance.is_superuser else "shopkeeper",
            },
        )

        if "phone" in validated_data:
            profile.phone = validated_data["phone"]

        if "role" in validated_data:
            profile.role = validated_data["role"]

        profile.save()

        return instance