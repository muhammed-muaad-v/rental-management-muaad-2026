from decimal import Decimal

from rest_framework import serializers

from .models import Payment, Expense


class PaymentSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:
        model = Payment

        fields = [
            "id",
            "rental",
            "customer",
            "customer_name",
            "amount",
            "payment_method",
            "payment_date",
            "notes",
        ]

        read_only_fields = [
            "id",
            "payment_date",
        ]

    def validate(self, attrs):

        rental = attrs.get(
            "rental",
            getattr(
                self.instance,
                "rental",
                None
            )
        )

        amount = attrs.get(
            "amount",
            getattr(
                self.instance,
                "amount",
                Decimal("0")
            )
        )

        if rental is None:
            raise serializers.ValidationError(
                {
                    "rental":
                    "Rental is required."
                }
            )

        rental_total = Decimal(
            str(rental.total_amount or 0)
        )

        # Existing payments for this rental
        payments = Payment.objects.filter(
            rental=rental
        )

        # When updating a payment,
        # don't count the same payment twice.
        if self.instance:
            payments = payments.exclude(
                id=self.instance.id
            )

        already_paid = sum(
            (
                Decimal(str(payment.amount))
                for payment in payments
            ),
            Decimal("0")
        )

        new_total_paid = (
            already_paid + Decimal(str(amount))
        )

        if new_total_paid > rental_total:

            remaining_amount = (
                rental_total - already_paid
            )

            raise serializers.ValidationError(
                {
                    "amount":
                    f"Payment cannot exceed the "
                    f"remaining amount of "
                    f"₹{remaining_amount:.2f}."
                }
            )

        return attrs


class ExpenseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Expense

        fields = [
            "id",
            "title",
            "category",
            "amount",
            "expense_date",
            "description",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]