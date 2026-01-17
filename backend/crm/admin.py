from django.contrib import admin
from .models import Client, SavedView, Task, Note, EmailTemplate, Email, GoogleToken

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'owner', 'created_at')
    search_fields = ('name', 'email')

@admin.register(SavedView)
class SavedViewAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'view_type', 'is_system')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'assigned_to', 'status', 'priority', 'due_date')
    list_filter = ('status', 'priority')

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('client', 'author', 'created_at')

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'owner', 'created_at')
    search_fields = ('name', 'subject')

@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'from_email', 'to_email', 'timestamp')

@admin.register(GoogleToken)
class GoogleTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
