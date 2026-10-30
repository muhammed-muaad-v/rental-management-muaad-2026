from rest_framework import generics

from .models import Payment, Expense
from .serializers import PaymentSerializer, ExpenseSerializer


class PaymentListCreateAPIView(generics.ListCreateAPIView):

    queryset = Payment.objects.select_related(
        "customer",
        "rental",
    ).all().order_by("-id")

    serializer_class = PaymentSerializer


class PaymentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Payment.objects.select_related(
        "customer",
        "rental",
    ).all()

    serializer_class = PaymentSerializer


class ExpenseListCreateAPIView(generics.ListCreateAPIView):

    queryset = Expense.objects.all().order_by("-id")

    serializer_class = ExpenseSerializer


class ExpenseDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Expense.objects.all()

    serializer_class = ExpenseSerializer