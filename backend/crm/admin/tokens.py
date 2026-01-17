from django.contrib import admin
from crm.models.tokens import GoogleToken

@admin.register(GoogleToken)
class GoogleTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
