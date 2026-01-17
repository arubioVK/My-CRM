from django.utils import timezone
import datetime
from crm.models.tasks import Task
from crm.models.emails import EmailTemplate
from crm.google_service import GoogleService

def execute_workflow_action(workflow, client):
    config = workflow.action_config
    
    if workflow.action_type == 'CREATE_TASK':
        title = config.get('task_title', 'New Task')
        description = config.get('task_description', '')
        due_days = int(config.get('due_days', 0))
        
        due_date = timezone.now() + datetime.timedelta(days=due_days)
        
        Task.objects.create(
            title=title,
            description=description,
            assigned_to=workflow.owner, # Assign to owner by default
            client=client,
            due_date=due_date
        )
        
    elif workflow.action_type == 'SEND_EMAIL':
        template_id = config.get('template_id')
        if not template_id:
            return
            
        try:
            template = EmailTemplate.objects.get(id=template_id, owner=workflow.owner)
            
            # Simple variable replacement
            subject = template.subject.replace('{{client_name}}', client.name)
            body = template.body.replace('{{client_name}}', client.name)
            body = body.replace('{{client_email}}', client.email or '')
            body = body.replace('{{client_phone}}', client.phone or '')
            # Add more replacements as needed
            
            if client.email:
                service = GoogleService(workflow.owner)
                service.send_email(client.email, subject, body)
                
        except EmailTemplate.DoesNotExist:
            print(f"Template {template_id} not found")
