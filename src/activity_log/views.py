from rest_framework import generics
from rest_framework.serializers import ModelSerializer

from .models import Activity


class ActivitySerializer(ModelSerializer):
    class Meta:
        model = Activity
        fields = "__all__"


class ActivityListCreateAPIView(generics.ListCreateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer