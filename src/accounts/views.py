from django.contrib.auth import get_user_model
from rest_framework import generics, permissions

from .serializers import MemberUserSerializer


User = get_user_model()


class UserListCreateAPIView(generics.ListCreateAPIView):

    queryset = User.objects.all().order_by("-id")
    serializer_class = MemberUserSerializer

    # Only staff/admin users can manage member accounts.
    permission_classes = [permissions.IsAdminUser]


class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = User.objects.all()
    serializer_class = MemberUserSerializer

    permission_classes = [permissions.IsAdminUser]