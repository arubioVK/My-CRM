from django.db import models
from django.contrib.auth.models import User
from .clients import Client

class Note(models.Model):
    content = models.TextField()
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note for {self.client.name} by {self.author.username if self.author else 'Unknown'}"
