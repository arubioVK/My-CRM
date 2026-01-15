from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from crm.models import Client, Note
import random

class Command(BaseCommand):
    help = 'Populates the database with dummy notes for clients'

    def handle(self, *args, **kwargs):
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found. Please create it first.'))
            return

        clients = Client.objects.all()
        if not clients.exists():
            self.stdout.write(self.style.WARNING('No clients found. Populate clients first.'))
            return

        # Optional: delete existing notes if you want a clean slate
        # Note.objects.all().delete()

        note_templates = [
            "Discussed the upcoming project milestones. They seem happy with progress.",
            "Called to follow up on the proposal. Waiting for their feedback by Friday.",
            "Client requested a discount on the annual subscription. To be discussed with management.",
            "Met at the industry conference. Interested in our new integration features.",
            "Reported a minor bug in the dashboard. Relayed to the engineering team.",
            "Sent the contract renewal documents. Bruce is reviewing them.",
            "Had a productive lunch meeting. They are considering expanding their contract next quarter.",
            "Left a voicemail regarding the missed payment. Need to follow up again on Monday.",
            "Great feedback on the latest update. They particularly like the new reporting tools.",
            "Client is moving to a new office next month. Update contact details in February.",
            "Expressed interest in a premium support plan. Need to send over the pricing tiers.",
            "Brief check-in call. Everything is running smoothly on their end.",
        ]

        notes_created = 0
        for client in clients:
            # Create 1 to 3 notes for each client
            num_notes = random.randint(1, 3)
            selected_notes = random.sample(note_templates, num_notes)
            
            for content in selected_notes:
                Note.objects.create(
                    content=content,
                    client=client,
                    author=admin_user
                )
                notes_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {notes_created} notes across {clients.count()} clients'))
