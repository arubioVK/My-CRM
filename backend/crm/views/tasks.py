from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q
from django.http import HttpResponse
import json
import pandas as pd
import io
from crm.models.tasks import Task
from crm.models.clients import SavedView
from crm.serializers.tasks import TaskSerializer
from crm.pagination import StandardResultsSetPagination
from crm.utils import build_q_object

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Task.objects.all()
        
        # 1. Handle Saved View ID
        view_id = self.request.query_params.get('view_id', None)
        if view_id:
            try:
                saved_view = SavedView.objects.get(id=view_id)
                q_obj = build_q_object(saved_view.filters, self.request.user)
                queryset = queryset.filter(q_obj)
            except SavedView.DoesNotExist:
                pass
        
        # 2. Handle direct filters
        filters_json = self.request.query_params.get('filters', None)
        if filters_json:
            try:
                filters = json.loads(filters_json)
                q_obj = build_q_object(filters, self.request.user)
                queryset = queryset.filter(q_obj)
            except (json.JSONDecodeError, TypeError):
                pass

        # 3. Handle Search
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(Q(title__icontains=search_query))

        # 3. Handle Client ID filtering
        client_id = self.request.query_params.get('client_id', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)

        # 4. Handle Sorting
        sort_field = 'created_at'
        sort_direction = 'desc'

        if view_id:
            try:
                saved_view = SavedView.objects.get(id=view_id)
                if saved_view.sorting:
                    sort_field = saved_view.sorting.get('field', sort_field)
                    sort_direction = saved_view.sorting.get('direction', sort_direction)
            except SavedView.DoesNotExist:
                pass

        sort_json = self.request.query_params.get('sort', None)
        if sort_json:
            try:
                sort_data = json.loads(sort_json)
                sort_field = sort_data.get('field', sort_field)
                sort_direction = sort_data.get('direction', sort_direction)
            except (json.JSONDecodeError, TypeError):
                pass

        # Map frontend field names to backend model paths
        sort_mapping = {
            'client_name': 'client__name',
            'assigned_to_name': 'assigned_to__username',
        }
        mapped_sort_field = sort_mapping.get(sort_field, sort_field)

        order_string = f"{'-' if sort_direction == 'desc' else ''}{mapped_sort_field}"
        queryset = queryset.order_by(order_string)
            
        return queryset

    @action(detail=False, methods=['GET'], url_path='export-view')
    def export(self, request):
        try:
            queryset = self.get_queryset()
            file_format = request.query_params.get('file_format', 'csv')
            columns_json = request.query_params.get('columns', None)
            
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            
            if not data:
                return Response({"detail": "No data to export"}, status=status.HTTP_400_BAD_REQUEST)
                
            df = pd.DataFrame(data)
            
            if columns_json:
                try:
                    columns = json.loads(columns_json)
                    valid_columns = [col for col in columns if col in df.columns]
                    if valid_columns:
                        df = df[valid_columns]
                except (json.JSONDecodeError, TypeError):
                    pass

            if file_format == 'xlsx':
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False, sheet_name='Tasks')
                response = HttpResponse(
                    output.getvalue(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="tasks_export.xlsx"'
                return response
            else:
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="tasks_export.csv"'
                df.to_csv(path_or_buf=response, index=False)
                return response
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.status == 'done':
            instance.completed_at = timezone.now()
            instance.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = self.request.data.get('status', old_status)
        
        if old_status != 'done' and new_status == 'done':
            serializer.save(completed_at=timezone.now())
        elif old_status == 'done' and new_status != 'done':
            serializer.save(completed_at=None)
        else:
            serializer.save()
