from rest_framework import generics, permissions
from ..models.user_config import UserConfig
from ..serializers.user_config import UserConfigSerializer

class UserConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = UserConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        config, created = UserConfig.objects.get_or_create(user=self.request.user)
        return config
