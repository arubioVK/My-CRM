from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from crm.models import SavedView

class Command(BaseCommand):
    help = 'Initializes system views'

    def handle(self, *args, **kwargs):
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found.'))
            return

        # "All Clients" - No filters
        SavedView.objects.update_or_create(
            name="All Clients",
            is_system=True,
            defaults={
                "user": admin_user,
                "filters": {"logic": "AND", "conditions": []},
                "position": 0
            }
        )

        # "My Clients" - owner = me
        SavedView.objects.update_or_create(
            name="My Clients",
            is_system=True,
            defaults={
                "user": admin_user,
                "filters": {
                    "logic": "AND", 
                    "conditions": [{"field": "owner", "operator": "exact", "value": "me"}]
                },
                "position": 1
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully initialized system views'))
