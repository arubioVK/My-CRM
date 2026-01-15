from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, SavedViewViewSet, TaskViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'saved-views', SavedViewViewSet, basename='saved-view')

urlpatterns = [
    path('', include(router.urls)),
]
