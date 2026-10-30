from rest_framework import serializers

from .models import Category, Equipment


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = "__all__"


class EquipmentSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )

    class Meta:
        model = Equipment

        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "total_stock",
            "available_stock",
            "daily_rent",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "category_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        total_stock = attrs.get(
            "total_stock",
            getattr(self.instance, "total_stock", 0)
        )

        available_stock = attrs.get(
            "available_stock",
            getattr(self.instance, "available_stock", 0)
        )

        if available_stock < 0:
            raise serializers.ValidationError({
                "available_stock":
                "Available stock cannot be negative."
            })

        if available_stock > total_stock:
            raise serializers.ValidationError({
                "available_stock":
                "Available stock cannot be greater than total stock."
            })

        return attrs

    def create(self, validated_data):

        total_stock = validated_data.get(
            "total_stock",
            0
        )

        # New equipment add cheyyumbol
        # full stock available aayirikkum.
        validated_data["available_stock"] = total_stock

        return Equipment.objects.create(
            **validated_data
        )