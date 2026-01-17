from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from crm.models.workflows import Workflow
from crm.models.clients import Client
from crm.serializers.workflows import WorkflowSerializer
from crm.utils import build_q_object

class WorkflowViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workflow.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['post'])
    def preview_count(self, request):
        filters = request.data.get('filters', {})
        try:
            q_obj = build_q_object(filters, request.user)
            # Match behavior of main Client list: check ALL clients, not just owned ones
            count = Client.objects.filter(q_obj).count()
            return Response({'count': count})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def run_matches(self, request, pk=None):
        workflow = self.get_object()
        
        # Override with request data if provided (allows running unsaved changes)
        filters = request.data.get('filters', workflow.filters)
        action_config = request.data.get('action_config', workflow.action_config)
        action_type = request.data.get('action_type', workflow.action_type)
        
        if not filters:
            return Response({'error': 'Workflow has no filters'}, status=400)

        # Update instance in memory only
        workflow.filters = filters
        workflow.action_config = action_config
        workflow.action_type = action_type

        try:
            from crm.services.workflow_service import execute_workflow_action
            
            q_obj = build_q_object(workflow.filters, request.user)
            # Find matching clients (all clients, matching preview logic)
            clients = Client.objects.filter(q_obj)
            
            count = 0
            for client in clients:
                try:
                    execute_workflow_action(workflow, client)
                    count += 1
                except Exception as e:
                    print(f"Error executing retroactive workflow for client {client.id}: {e}")
            
            return Response({'count': count, 'message': f'Workflow executed for {count} clients'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
