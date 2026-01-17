from rest_framework import serializers
from crm.models.workflows import Workflow

class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = '__all__'
        read_only_fields = ('owner', 'created_at', 'updated_at')
