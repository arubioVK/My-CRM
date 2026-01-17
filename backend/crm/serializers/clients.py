from rest_framework import serializers
from crm.models.clients import Client, SavedView

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class SavedViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedView
        fields = '__all__'
        read_only_fields = ['user', 'is_system']
