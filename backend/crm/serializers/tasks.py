from rest_framework import serializers
from crm.models.tasks import Task

class TaskSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')

    class Meta:
        model = Task
        fields = '__all__'
