from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Client, SavedView, Task
from .serializers import ClientSerializer, SavedViewSerializer, TaskSerializer
from .utils import build_q_object
from rest_framework.decorators import action
from django.http import HttpResponse
import json
import pandas as pd
import io

import io
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_data(request, type):
    print(f"DEBUG: Standalone export called for {type} by {request.user}")
    
    if type == 'clients':
        queryset = Client.objects.all()
        # Apply filters logic here (simplified for debug)
        view_id = request.query_params.get('view_id', None)
        if view_id:
            try:
                saved_view = SavedView.objects.get(id=view_id)
                q_obj = build_q_object(saved_view.filters, request.user)
                queryset = queryset.filter(q_obj)
            except SavedView.DoesNotExist:
                pass
        
        serializer = ClientSerializer(queryset, many=True)
        sheet_name = 'Clients'
        filename = 'clients_export'
    elif type == 'tasks':
        queryset = Task.objects.all()
        # Apply filters logic here
        view_id = request.query_params.get('view_id', None)
        if view_id:
            try:
                saved_view = SavedView.objects.get(id=view_id)
                q_obj = build_q_object(saved_view.filters, request.user)
                queryset = queryset.filter(q_obj)
            except SavedView.DoesNotExist:
                pass
        
        serializer = TaskSerializer(queryset, many=True)
        sheet_name = 'Tasks'
        filename = 'tasks_export'
    else:
        return Response({"detail": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.data
    if not data:
        return Response({"detail": "No data to export"}, status=status.HTTP_400_BAD_REQUEST)
        
    df = pd.DataFrame(data)
    
    # Handle columns
    columns_json = request.query_params.get('columns', None)
    if columns_json:
        try:
            columns = json.loads(columns_json)
            valid_columns = [col for col in columns if col in df.columns]
            if valid_columns:
                df = df[valid_columns]
        except (json.JSONDecodeError, TypeError):
            pass

    format = request.query_params.get('format', 'csv')
    if format == 'xlsx':
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name=sheet_name)
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
        return response
    else:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        df.to_csv(path_or_buf=response, index=False)
        return response

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def get_queryset(self):
        queryset = Client.objects.all()
        
        # 1. Handle Saved View ID
        view_id = self.request.query_params.get('view_id', None)
        if view_id:
            try:
                saved_view = SavedView.objects.get(id=view_id)
                # Apply filters from saved view
                q_obj = build_q_object(saved_view.filters, self.request.user)
                queryset = queryset.filter(q_obj)
            except SavedView.DoesNotExist:
                pass
        
        # 2. Handle direct filters (JSON string)
        filters_json = self.request.query_params.get('filters', None)
        if filters_json:
            try:
                filters = json.loads(filters_json)
                q_obj = build_q_object(filters, self.request.user)
                queryset = queryset.filter(q_obj)
            except (json.JSONDecodeError, TypeError):
                pass

        # 3. Legacy view_mode (for "My Clients")
        view_mode = self.request.query_params.get('view', None)
        if view_mode == 'my' and self.request.user.is_authenticated:
            queryset = queryset.filter(owner=self.request.user)

        # 4. Handle Sorting
        sort_field = 'name'
        sort_direction = 'asc'

        # Try to get sorting from saved view first
        if view_id:
            try:
                saved_view = SavedView.objects.get(id=view_id)
                if saved_view.sorting:
                    sort_field = saved_view.sorting.get('field', 'name')
                    sort_direction = saved_view.sorting.get('direction', 'asc')
            except SavedView.DoesNotExist:
                pass

        # Override with direct sorting if provided
        sort_json = self.request.query_params.get('sort', None)
        if sort_json:
            try:
                sort_data = json.loads(sort_json)
                sort_field = sort_data.get('field', sort_field)
                sort_direction = sort_data.get('direction', sort_direction)
            except (json.JSONDecodeError, TypeError):
                pass

        order_string = f"{'-' if sort_direction == 'desc' else ''}{sort_field}"
        queryset = queryset.order_by(order_string)
            
        return queryset

    @action(detail=False, methods=['GET'], url_path='export-data')
    def export(self, request):
        print(f"DEBUG: Client export action called by {request.user}")
        print(f"DEBUG: Query params: {request.query_params}")
        queryset = self.get_queryset()
        format = request.query_params.get('format', 'csv')
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

        if format == 'xlsx':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Clients')
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="clients_export.xlsx"'
            return response
        else:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="clients_export.csv"'
            df.to_csv(path_or_buf=response, index=False)
            return response

class SavedViewViewSet(viewsets.ModelViewSet):
    serializer_class = SavedViewSerializer

    def get_queryset(self):
        # Return user's views + system views, ordered by position
        queryset = SavedView.objects.filter(Q(user=self.request.user) | Q(is_system=True))
        
        view_type = self.request.query_params.get('view_type', None)
        if view_type:
            queryset = queryset.filter(view_type=view_type)
            
        return queryset.order_by('position', 'id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.is_system:
            # Allow staff to update system views (e.g. for maintenance)
            if not self.request.user.is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Cannot update system views")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system:
            return Response({"error": "Cannot delete system views"}, status=400)
        return super().destroy(request, *args, **kwargs)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

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

        order_string = f"{'-' if sort_direction == 'desc' else ''}{sort_field}"
        queryset = queryset.order_by(order_string)
            
        return queryset

    @action(detail=False, methods=['GET'], url_path='export-data')
    def export(self, request):
        print(f"DEBUG: Task export action called by {request.user}")
        print(f"DEBUG: Query params: {request.query_params}")
        queryset = self.get_queryset()
        format = request.query_params.get('format', 'csv')
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

        if format == 'xlsx':
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

    def perform_create(self, serializer):
        # Default assigned_to to current user if not provided?
        # For now, just save as is.
        serializer.save()
