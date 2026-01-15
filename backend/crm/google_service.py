import datetime
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from django.conf import settings
from .models import GoogleToken, Email, Client
from django.utils import timezone
import base64

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']

class GoogleService:
    def __init__(self, user):
        self.user = user
        self.credentials = self._get_credentials()

    def _get_credentials(self):
        try:
            token_obj = GoogleToken.objects.get(user=self.user)
            creds = Credentials(
                token=token_obj.access_token,
                refresh_token=token_obj.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                expiry=token_obj.expires_at
            )
            
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                token_obj.access_token = creds.token
                token_obj.expires_at = creds.expiry
                token_obj.save()
            
            return creds
        except GoogleToken.DoesNotExist:
            return None

    @staticmethod
    def get_auth_url():
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        authorization_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
        return authorization_url, state

    def fetch_emails(self):
        if not self.credentials:
            return []

        service = build('gmail', 'v1', credentials=self.credentials)
        results = service.users().messages().list(userId='me', maxResults=10).execute()
        messages = results.get('messages', [])

        synced_emails = []
        for msg in messages:
            # Check if email already exists
            if Email.objects.filter(message_id=msg['id']).exists():
                continue

            msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
            payload = msg_data.get('payload', {})
            headers = payload.get('headers', [])
            
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '(No Subject)')
            from_email = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
            to_email = next((h['value'] for h in headers if h['name'].lower() == 'to'), '')
            
            # Simple body extraction
            body = ""
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/plain':
                        body = base64.urlsafe_b64decode(part['body']['data']).decode()
                        break
            elif 'body' in payload and 'data' in payload['body']:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode()

            # Parse from_email to get actual address
            if '<' in from_email:
                from_email = from_email.split('<')[1].split('>')[0]

            # Find matching client
            client = Client.objects.filter(email=from_email).first()

            email_obj = Email.objects.create(
                message_id=msg['id'],
                thread_id=msg_data['threadId'],
                subject=subject,
                body=body,
                from_email=from_email,
                to_email=to_email,
                timestamp=timezone.now(), # Ideally parse from header 'Date'
                client=client,
                user=self.user
            )
            synced_emails.append(email_obj)
        
        return synced_emails

    def send_email(self, to_email, subject, body):
        if not self.credentials:
            return None

        service = build('gmail', 'v1', credentials=self.credentials)
        
        from email.mime.text import MIMEText
        import base64

        message = MIMEText(body)
        message['to'] = to_email
        message['subject'] = subject
        
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        try:
            sent_message = service.users().messages().send(userId='me', body={'raw': raw}).execute()
            return sent_message
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
