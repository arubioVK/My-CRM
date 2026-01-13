from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import UserSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @method_decorator(ensure_csrf_cookie)
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            response_data = UserSerializer(user).data
            response_data['csrfToken'] = get_token(request)
            return Response(response_data)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})

class UserView(APIView):
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        response_data = UserSerializer(request.user).data
        response_data['csrfToken'] = get_token(request)
        return Response(response_data)

class UserListView(APIView):
    def get(self, request):
        users = User.objects.all().values('id', 'username')
        return Response(list(users))
