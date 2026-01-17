from rest_framework import viewsets, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from crm.models.emails import Email, EmailTemplate
from crm.models.clients import Client
from crm.serializers.emails import EmailSerializer, EmailTemplateSerializer
from crm.google_service import GoogleService

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
        include_signature = request.data.get('include_signature', False)
        attachments = request.FILES.getlist('attachments')

        if not all([to_email, subject, body]):
            return Response({"error": "Required fields missing"}, status=400)

        final_body = body
        if include_signature:
            from crm.models.user_config import UserConfig
            config = UserConfig.objects.filter(user=request.user).first()
            if config and config.email_signature:
                # Add a couple of line breaks and the signature
                final_body = f"{body}<br><br>{config.email_signature}"

        service = GoogleService(request.user)
        sent_message = service.send_email(to_email, subject, final_body, attachments=attachments)

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

class EmailTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = EmailTemplateSerializer

    def get_queryset(self):
        return EmailTemplate.objects.filter(owner=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
