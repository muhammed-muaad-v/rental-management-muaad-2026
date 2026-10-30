from django.db import transaction
from rest_framework import serializers
from activity_log.models import Activity

from .models import (
    Rental,
    RentalItem,
    RentalReturn,
)


class RentalSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:

        model = Rental

        fields = [
            "id",
            "customer",
            "customer_name",
            "site_name",
            "total_amount",
            "rental_date",
            "actual_return_date",
            "status",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "total_amount",
            "rental_date",
            "actual_return_date",
            "status",
            "created_at",
        ]


class RentalItemSerializer(serializers.ModelSerializer):

    equipment_name = serializers.CharField(
        source="equipment.name",
        read_only=True
    )

    remaining_quantity = serializers.SerializerMethodField()

    class Meta:

        model = RentalItem

        fields = [
            "id",
            "rental",
            "equipment",
            "equipment_name",
            "quantity",
            "daily_rent",
            "returned_quantity",
            "remaining_quantity",
        ]

        read_only_fields = [
            "id",
            "returned_quantity",
            "remaining_quantity",
        ]

    def get_remaining_quantity(self, obj):

        return (
            obj.quantity
            - obj.returned_quantity
        )

    def validate(self, attrs):

        equipment = attrs.get(
            "equipment",
            getattr(
                self.instance,
                "equipment",
                None
            )
        )

        quantity = attrs.get(
            "quantity",
            getattr(
                self.instance,
                "quantity",
                0
            )
        )

        if quantity <= 0:

            raise serializers.ValidationError(
                {
                    "quantity":
                    "Quantity must be greater than 0."
                }
            )

        if self.instance:

            old_remaining = (
                self.instance.quantity
                - self.instance.returned_quantity
            )

            new_remaining = (
                quantity - self.instance.returned_quantity
            )

            if equipment == self.instance.equipment:

                additional_needed = (
                    new_remaining
                    - old_remaining
                )

                if (
                    additional_needed > 0
                    and additional_needed
                    > equipment.available_stock
                ):

                    raise serializers.ValidationError(
                        {
                            "quantity":
                            f"Only "
                            f"{equipment.available_stock} "
                            f"units are available."
                        }
                    )

        else:

            if quantity > equipment.available_stock:

                raise serializers.ValidationError(
                    {
                        "quantity":
                        f"Only "
                        f"{equipment.available_stock} "
                        f"units are available."
                    }
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        equipment = validated_data["equipment"]

        quantity = validated_data["quantity"]

        equipment.available_stock -= quantity

        equipment.save(
            update_fields=[
                "available_stock"
            ]
        )

        return RentalItem.objects.create(
            **validated_data
        )

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data
    ):

        old_equipment = instance.equipment

        old_quantity = instance.quantity

        new_equipment = validated_data.get(
            "equipment",
            old_equipment
        )

        new_quantity = validated_data.get(
            "quantity",
            old_quantity
        )

        returned_quantity = (
            instance.returned_quantity
        )

        if new_quantity < returned_quantity:

            raise serializers.ValidationError(
                {
                    "quantity":
                    "Quantity cannot be less "
                    "than returned quantity."
                }
            )

        old_remaining = (
            old_quantity
            - returned_quantity
        )

        new_remaining = (
            new_quantity
            - returned_quantity
        )

        if old_equipment != new_equipment:

            old_equipment.available_stock += (
                old_remaining
            )

            old_equipment.save(
                update_fields=[
                    "available_stock"
                ]
            )

            if new_remaining > (
                new_equipment.available_stock
            ):

                raise serializers.ValidationError(
                    {
                        "equipment":
                        f"Only "
                        f"{new_equipment.available_stock} "
                        f"units are available."
                    }
                )

            new_equipment.available_stock -= (
                new_remaining
            )

            new_equipment.save(
                update_fields=[
                    "available_stock"
                ]
            )

        else:

            difference = (
                new_remaining
                - old_remaining
            )

            if difference > (
                new_equipment.available_stock
            ):

                raise serializers.ValidationError(
                    {
                        "quantity":
                        f"Only "
                        f"{new_equipment.available_stock} "
                        f"additional units are available."
                    }
                )

            new_equipment.available_stock -= (
                difference
            )

            new_equipment.save(
                update_fields=[
                    "available_stock"
                ]
            )

        return super().update(
            instance,
            validated_data
        )


class RentalReturnSerializer(
    serializers.ModelSerializer
):

    equipment_name = serializers.CharField(
        source="rental_item.equipment.name",
        read_only=True
    )

    rental_id = serializers.IntegerField(
        source="rental_item.rental.id",
        read_only=True
    )

    customer_name = serializers.CharField(
        source="rental_item.rental.customer.name",
        read_only=True
    )

    daily_rent = serializers.DecimalField(
        source="rental_item.daily_rent",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:

        model = RentalReturn

        fields = [
            "id",
            "rental_item",
            "rental_id",
            "customer_name",
            "equipment_name",
            "quantity",
            "return_date",
            "daily_rent",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "return_date",
            "created_at",
        ]

    def validate(self, attrs):

        rental_item = attrs["rental_item"]

        quantity = attrs["quantity"]

        remaining = (
            rental_item.quantity
            - rental_item.returned_quantity
        )

        if quantity <= 0:

            raise serializers.ValidationError(
                {
                    "quantity":
                    "Return quantity must be greater than 0."
                }
            )

        if quantity > remaining:

            raise serializers.ValidationError(
                {
                    "quantity":
                    f"Only {remaining} units "
                    f"are remaining."
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        rental_item = (
            validated_data["rental_item"]
        )

        quantity = validated_data["quantity"]

        rental = rental_item.rental

        equipment = rental_item.equipment

        # Create return record
        return_record = RentalReturn.objects.create(
            **validated_data
        )

        # Update returned quantity
        rental_item.returned_quantity += quantity

        rental_item.save(
            update_fields=[
                "returned_quantity"
            ]
        )

        # Add returned stock
        equipment.available_stock += quantity

        equipment.save(
            update_fields=[
                "available_stock"
            ]
        )
        
        Activity.objects.create(
            action="create",
            category="Rental Return",
            description=(
                f"Equipment returned: {equipment.name}, "
                f"Quantity: {quantity}, "
                f"Customer: {rental.customer.name}"
            ),
            user="System",
        )

        # Update billing
        rental.update_total_amount()

        # Update active/completed status
        rental.update_status()

        return return_record