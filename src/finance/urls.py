from django.urls import path

from .views import (
    PaymentListCreateAPIView,
    PaymentDetailAPIView,
    ExpenseListCreateAPIView,
    ExpenseDetailAPIView,
)


urlpatterns = [

    path(
        "payments/",
        PaymentListCreateAPIView.as_view(),
        name="payment-list",
    ),

    path(
        "payments/<int:pk>/",
        PaymentDetailAPIView.as_view(),
        name="payment-detail",
    ),

    path(
        "expenses/",
        ExpenseListCreateAPIView.as_view(),
        name="expense-list",
    ),

    path(
        "expenses/<int:pk>/",
        ExpenseDetailAPIView.as_view(),
        name="expense-detail",
    ),

]