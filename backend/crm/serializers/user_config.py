from rest_framework import serializers
from ..models.user_config import UserConfig

class UserConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserConfig
        fields = ['email_signature']
