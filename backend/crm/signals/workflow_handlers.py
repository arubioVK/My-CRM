from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from crm.models.clients import Client
from crm.models.tasks import Task
from crm.models.workflows import Workflow
from crm.models.emails import EmailTemplate
from django.utils import timezone
import datetime
from crm.google_service import GoogleService

from crm.utils import build_q_object
from crm.services.workflow_service import execute_workflow_action

@receiver(post_save, sender=Client)
def handle_client_created(sender, instance, created, **kwargs):
    if not created:
        return

    # Find active workflows for this trigger
    workflows = Workflow.objects.filter(
        owner=instance.owner, 
        trigger_type='CLIENT_CREATED', 
        is_active=True
    )

    for workflow in workflows:
        # Check filters if they exist
        if workflow.filters:
            try:
                # We need to check if this specific instance matches the filters.
                # Since build_q_object returns a Q object designed for filtering a QuerySet,
                # we can use it to filter a QuerySet containing only this instance.
                q_obj = build_q_object(workflow.filters, workflow.owner)
                matches = Client.objects.filter(pk=instance.pk).filter(q_obj).exists()
                if not matches:
                    continue
            except Exception as e:
                print(f"Error evaluating filters for workflow {workflow.name}: {e}")
                continue

        try:
            execute_workflow_action(workflow, instance)
        except Exception as e:
            print(f"Error executing workflow {workflow.name}: {e}")


