from django.db import models
from django.contrib.auth.models import User
from .clients import Client

class Email(models.Model):
    message_id = models.CharField(max_length=255, unique=True)
    thread_id = models.CharField(max_length=255)
    subject = models.CharField(max_length=512, blank=True, null=True)
    body = models.TextField(blank=True, null=True)
    from_email = models.EmailField()
    to_email = models.EmailField()
    timestamp = models.DateTimeField()
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='emails')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emails')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Email: {self.subject} from {self.from_email}"

class EmailTemplate(models.Model):
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=512)
    body = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
