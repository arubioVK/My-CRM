from django.contrib import admin
from crm.models.clients import Client, SavedView

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'owner', 'created_at')
    search_fields = ('name', 'email')

@admin.register(SavedView)
class SavedViewAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'view_type', 'is_system')
