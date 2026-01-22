from django.contrib.auth.models import User
from rest_framework import serializers
from crm.serializers.user_config import UserConfigSerializer
from crm.models.user_config import UserConfig

class UserSerializer(serializers.ModelSerializer):
    config = UserConfigSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'config']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        config_data = validated_data.pop('config', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update config fields
        if config_data:
            config, created = UserConfig.objects.get_or_create(user=instance)
            for attr, value in config_data.items():
                setattr(config, attr, value)
            config.save()
            
        return instance

    def create(self, validated_data):
        config_data = validated_data.pop('config', None)
        user = User.objects.create(**validated_data)
        
        if config_data:
            UserConfig.objects.create(user=user, **config_data)
        else:
            UserConfig.objects.create(user=user)
            
        return user
