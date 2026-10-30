from rest_framework import generics
from activity_log.models import Activity

from .models import (
    Rental,
    RentalItem,
    RentalReturn,
)

from .serializers import (
    RentalSerializer,
    RentalItemSerializer,
    RentalReturnSerializer,
)


class RentalListCreateAPIView(
    generics.ListCreateAPIView
):

    queryset = (
        Rental.objects
        .select_related("customer")
        .all()
        .order_by("-id")
    )

    serializer_class = RentalSerializer
    
    def perform_create(self, serializer):
        rental = serializer.save()

        Activity.objects.create(
            action="create",
            category="Rental",
            description=f"Rental created: {rental}",
            user="System",
        )


class RentalDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = (
        Rental.objects
        .select_related("customer")
        .all()
    )

    serializer_class = RentalSerializer
    
    def perform_update(self, serializer):
        rental = serializer.save()

        Activity.objects.create(
            action="update",
            category="Rental",
            description=f"Rental updated: {rental}",
            user="System",
        )


class RentalItemListCreateAPIView(
    generics.ListCreateAPIView
):

    queryset = (
        RentalItem.objects
        .select_related(
            "rental",
            "equipment"
        )
        .all()
        .order_by("-id")
    )

    serializer_class = RentalItemSerializer


class RentalItemDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = (
        RentalItem.objects
        .select_related(
            "rental",
            "equipment"
        )
        .all()
    )

    serializer_class = RentalItemSerializer


class RentalReturnListCreateAPIView(
    generics.ListCreateAPIView
):

    queryset = (
        RentalReturn.objects
        .select_related(
            "rental_item",
            "rental_item__rental",
            "rental_item__equipment",
            "rental_item__rental__customer",
        )
        .all()
        .order_by("-return_date", "-id")
    )

    serializer_class = RentalReturnSerializer


class RentalReturnDetailAPIView(
    generics.RetrieveAPIView
):

    queryset = (
        RentalReturn.objects
        .select_related(
            "rental_item",
            "rental_item__rental",
            "rental_item__equipment",
            "rental_item__rental__customer",
        )
        .all()
    )

    serializer_class = RentalReturnSerializer