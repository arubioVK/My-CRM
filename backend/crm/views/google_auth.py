from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
from google_auth_oauthlib.flow import Flow
from crm.models.tokens import GoogleToken
from crm.google_service import GoogleService

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

    @action(detail=False, methods=['POST'])
    def disconnect(self, request):
        GoogleToken.objects.filter(user=request.user).delete()
        return Response({"status": "success"})

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
