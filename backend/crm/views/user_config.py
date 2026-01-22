from rest_framework import generics, permissions
from ..models.user_config import UserConfig
from ..serializers.user_config import UserConfigSerializer

class UserConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = UserConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        config, created = UserConfig.objects.get_or_create(user=self.request.user)
        return config

    def perform_update(self, serializer):
        # Prevent non-staff users from changing their own visibility permissions
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            # Revert visibility fields to their current values
            instance = self.get_object()
            serializer.save(
                see_all_clients=instance.see_all_clients,
                see_all_tasks=instance.see_all_tasks
            )
        else:
            serializer.save()
