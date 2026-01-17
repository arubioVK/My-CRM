from django.contrib import admin
from crm.models.tasks import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'assigned_to', 'status', 'priority', 'due_date')
    list_filter = ('status', 'priority')
