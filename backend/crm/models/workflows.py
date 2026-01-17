from django.db import models
from django.conf import settings

class Workflow(models.Model):
    TRIGGER_CHOICES = (
        ('CLIENT_CREATED', 'Client Created'),
        # Add more triggers here in the future
    )

    ACTION_CHOICES = (
        ('CREATE_TASK', 'Create Task'),
        ('SEND_EMAIL', 'Send Email'),
        # Add more actions here
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workflows')
    
    trigger_type = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    
    # Store configuration for the action (e.g., {"task_title": "Follow up", "due_days": 3})
    action_config = models.JSONField(default=dict)
    
    # Logic Filters: only execute if these conditions are met
    filters = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
