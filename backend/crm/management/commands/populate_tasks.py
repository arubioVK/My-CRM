from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from crm.models import Client, Task
from django.utils import timezone
import datetime
import random

class Command(BaseCommand):
    help = 'Populates the database with dummy tasks'

    def handle(self, *args, **kwargs):
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found.'))
            return

        clients = list(Client.objects.all())
        if not clients:
            self.stdout.write(self.style.ERROR('No clients found. Please populate clients first.'))
            return

        Task.objects.all().delete()

        task_titles = [
            "Follow up on proposal",
            "Schedule demo call",
            "Send contract for signature",
            "Review requirements document",
            "Update contact information",
            "Prepare quarterly report",
            "Send welcome email",
            "Check payment status",
            "Discuss renewal options",
            "Organize site visit",
            "Finalize project scope",
            "Send product catalog",
            "Request feedback on service",
            "Update billing address",
            "Schedule technical review"
        ]

        statuses = ['todo', 'in_progress', 'done']
        priorities = ['low', 'medium', 'high']

        created_count = 0
        for title in task_titles:
            client = random.choice(clients)
            status = random.choice(statuses)
            priority = random.choice(priorities)
            
            # Random due date within the next 30 days
            due_date = timezone.now() + datetime.timedelta(days=random.randint(-5, 30))
            
            Task.objects.create(
                title=title,
                description=f"Description for {title}",
                status=status,
                priority=priority,
                due_date=due_date,
                client=client,
                assigned_to=admin_user if random.random() > 0.3 else None
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} tasks'))
