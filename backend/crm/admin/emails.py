from django.contrib import admin
from crm.models.emails import Email, EmailTemplate

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'owner', 'created_at')
    search_fields = ('name', 'subject')

@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'from_email', 'to_email', 'timestamp')
