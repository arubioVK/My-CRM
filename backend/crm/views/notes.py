from rest_framework import viewsets
from crm.models.notes import Note
from crm.serializers.notes import NoteSerializer

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
