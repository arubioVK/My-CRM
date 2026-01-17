from django.contrib import admin
from crm.models.notes import Note

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('client', 'author', 'created_at')
