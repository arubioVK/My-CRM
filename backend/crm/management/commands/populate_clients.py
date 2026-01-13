from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from crm.models import Client
import random

class Command(BaseCommand):
    help = 'Populates the database with dummy clients'

    def handle(self, *args, **kwargs):
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found. Please create it first.'))
            return

        Client.objects.all().delete()

        clients_data = [
            {"name": "Acme Corp", "email": "contact@acme.com", "phone": "555-0101", "address": "123 Elm St"},
            {"name": "Globex", "email": "info@globex.com", "phone": "555-0102", "address": "456 Oak Ave"},
            {"name": "Soylent Corp", "email": "sales@soylent.com", "phone": "555-0103", "address": "789 Pine Ln"},
            {"name": "Initech", "email": "support@initech.com", "phone": "555-0104", "address": "101 Maple Dr"},
            {"name": "Umbrella Corp", "email": "bio@umbrella.com", "phone": "555-0105", "address": "202 Birch Rd"},
            {"name": "Stark Ind", "email": "tony@stark.com", "phone": "555-0106", "address": "303 Cedar Blvd"},
            {"name": "Wayne Ent", "email": "bruce@wayne.com", "phone": "555-0107", "address": "404 Spruce Ct"},
            {"name": "Cyberdyne", "email": "skynet@cyberdyne.com", "phone": "555-0108", "address": "505 Walnut Way"},
            {"name": "Massive Dynamic", "email": "bell@massive.com", "phone": "555-0109", "address": "606 Ash Pl"},
            {"name": "Hooli", "email": "gavin@hooli.com", "phone": "555-0110", "address": "707 Fir St"},
        ]

        for i, data in enumerate(clients_data):
            # Assign first 5 to admin, rest to None (or random if we had more users)
            owner = admin_user if i < 5 else None
            Client.objects.create(owner=owner, **data)

        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(clients_data)} clients'))
