from rest_framework import serializers
from .models import Client, SavedView, Task, Note, GoogleToken, Email
from django.contrib.auth.models import User

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class SavedViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedView
        fields = '__all__'
        read_only_fields = ['user', 'is_system']

class TaskSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')

    class Meta:
        model = Task
        fields = '__all__'

class NoteSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Note
        fields = '__all__'

class GoogleTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleToken
        fields = '__all__'

class EmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Email
        fields = '__all__'
