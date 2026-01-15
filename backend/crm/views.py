from rest_framework import viewsets, status, parsers
from rest_framework.response import Response
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Client, SavedView, Task, Note
from .serializers import ClientSerializer, SavedViewSerializer, TaskSerializer, NoteSerializer
from .utils import build_q_object
from rest_framework.decorators import action
from django.http import HttpResponse
import json
import pandas as pd
import io
from .pagination import StandardResultsSetPagination
from .google_service import GoogleService
from google_auth_oauthlib.flow import Flow
from .models import GoogleToken, Email, Note, Client, SavedView, Task
from .serializers import GoogleTokenSerializer, EmailSerializer, NoteSerializer, ClientSerializer, SavedViewSerializer, TaskSerializer
import datetime
from django.utils import timezone

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    pagination_class = StandardResultsSetPagination

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

    @action(detail=False, methods=['GET'], url_path='export-view')
    def export(self, request):
        print("DEBUG: EXPORT ACTION HIT (Clients) - START")
        try:
            queryset = self.get_queryset()
            print(f"DEBUG: Queryset count: {queryset.count()}")
            file_format = request.query_params.get('file_format', 'csv')
            columns_json = request.query_params.get('columns', None)
            
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            print(f"DEBUG: Data length: {len(data)}")
            
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
        except Exception as e:
            print(f"DEBUG: EXPORT ERROR: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

    @action(detail=False, methods=['GET'], url_path='export-view')
    def export(self, request):
        print("DEBUG: EXPORT ACTION HIT (Tasks) - START")
        try:
            queryset = self.get_queryset()
            print(f"DEBUG: Queryset count: {queryset.count()}")
            file_format = request.query_params.get('file_format', 'csv')
            columns_json = request.query_params.get('columns', None)
            
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            print(f"DEBUG: Data length: {len(data)}")
            
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
            print(f"DEBUG: EXPORT ERROR: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        # Default assigned_to to current user if not provided?
        # For now, just save as is.
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

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

    def get_queryset(self):
        queryset = Note.objects.all()
        client_id = self.request.query_params.get('client_id', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class EmailViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Email.objects.all()
    serializer_class = EmailSerializer
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        queryset = Email.objects.filter(user=self.request.user)
        client_id = self.request.query_params.get('client_id', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['post'])
    def sync(self, request):
        service = GoogleService(request.user)
        emails = service.fetch_emails()
        return Response({"status": "synced", "count": len(emails)})

    @action(detail=False, methods=['post'])
    def send(self, request):
        to_email = request.data.get('to_email')
        subject = request.data.get('subject')
        body = request.data.get('body')
        client_id = request.data.get('client_id')
        attachments = request.FILES.getlist('attachments')

        if not all([to_email, subject, body]):
            return Response({"error": "Required fields missing"}, status=400)

        service = GoogleService(request.user)
        sent_message = service.send_email(to_email, subject, body, attachments=attachments)

        if sent_message:
            # Create Email record in DB
            client = Client.objects.filter(id=client_id).first() if client_id else None
            email_obj = Email.objects.create(
                message_id=sent_message['id'],
                thread_id=sent_message['threadId'],
                subject=subject,
                body=body,
                from_email="me", # Gmail API specific, can be refined
                to_email=to_email,
                timestamp=timezone.now(),
                client=client,
                user=request.user
            )
            return Response(EmailSerializer(email_obj).data)
        else:
            return Response({"error": "Failed to send email"}, status=500)

class GoogleAuthView(viewsets.ViewSet):
    def list(self, request):
        auth_url, state = GoogleService.get_auth_url()
        # Save state in session for verification if needed
        request.session['google_oauth_state'] = state
        return Response({"url": auth_url})

    @action(detail=False, methods=['GET'])
    def check(self, request):
        has_token = GoogleToken.objects.filter(user=request.user).exists()
        return Response({"connected": has_token})

class GoogleCallbackView(viewsets.ViewSet):
    def list(self, request):
        code = request.query_params.get('code')
        if not code:
            return Response({"error": "No code provided"}, status=400)

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        creds = flow.credentials

        GoogleToken.objects.update_or_create(
            user=request.user,
            defaults={
                "access_token": creds.token,
                "refresh_token": creds.refresh_token,
                "expires_at": creds.expiry
            }
        )

        return Response({"status": "success"})
