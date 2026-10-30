from rest_framework import generics
from activity_log.models import Activity
from .models import Customer
from .serializers import CustomerSerializer


class CustomerListCreateAPIView(generics.ListCreateAPIView):

    queryset = Customer.objects.all().order_by("-id")
    serializer_class = CustomerSerializer
    
    def perform_create(self, serializer):
        customer = serializer.save()

        Activity.objects.create(
            action="create",
            category="Customer",
            description=f"Customer created: {customer.name}",
            user="System",
        )


class CustomerDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def perform_update(self, serializer):
        customer = serializer.save()

        Activity.objects.create(
            action="update",
            category="Customer",
            description=f"Customer updated: {customer.name}",
            user="System",
        )
        
    def perform_destroy(self, instance):
        customer_name = instance.name

        Activity.objects.create(
            action="delete",
            category="Customer",
            description=f"Customer deleted: {customer_name}",
            user="System",
        )

        instance.delete()    