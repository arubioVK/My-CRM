from django.db import models
from django.contrib.auth.models import User

class UserConfig(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='config')
    email_signature = models.TextField(default="", blank=True)
    see_all_clients = models.BooleanField(default=True)
    see_all_tasks = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Config for {self.user.username}"
