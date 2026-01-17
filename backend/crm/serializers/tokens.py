from rest_framework import serializers
from crm.models.tokens import GoogleToken

class GoogleTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleToken
        fields = '__all__'
