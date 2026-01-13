from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Client, SavedView
from .serializers import ClientSerializer, SavedViewSerializer
from .utils import build_q_object
import json

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

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

class SavedViewViewSet(viewsets.ModelViewSet):
    serializer_class = SavedViewSerializer

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_queryset(self):
        # Return user's views + system views, ordered by position
        return SavedView.objects.filter(Q(user=self.request.user) | Q(is_system=True)).order_by('position', 'id')

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
