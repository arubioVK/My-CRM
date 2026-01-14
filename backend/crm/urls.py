from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ClientViewSet, SavedViewViewSet, TaskViewSet, export_data

router = SimpleRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'saved-views', SavedViewViewSet, basename='saved-view')

urlpatterns = [
    path('export/<str:type>/', export_data, name='export-data'),
    path('', include(router.urls)),
]
