from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, SavedViewViewSet, TaskViewSet, NoteViewSet, GoogleAuthView, GoogleCallbackView, EmailViewSet, EmailTemplateViewSet, UserConfigView

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'saved-views', SavedViewViewSet, basename='saved-view')
router.register(r'google/auth', GoogleAuthView, basename='google-auth')
router.register(r'google/callback', GoogleCallbackView, basename='google-callback')
router.register(r'emails', EmailViewSet, basename='email')
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')

urlpatterns = [
    path('config/', UserConfigView.as_view(), name='user-config'),
    path('', include(router.urls)),
]
