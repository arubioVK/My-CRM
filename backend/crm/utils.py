from django.db.models import Q

def build_q_object(filters, user=None):
    """
    Recursively builds a Q object from a nested filter structure.
    Structure: { 'logic': 'AND'|'OR', 'conditions': [ {field, operator, value} | {logic, conditions} ] }
    """
    if not filters or not isinstance(filters, dict):
        return Q()

    logic = filters.get('logic', 'AND').upper()
    conditions = filters.get('conditions', [])
    
    q_obj = Q()
    
    for cond in conditions:
        if 'logic' in cond:
            # Nested group
            sub_q = build_q_object(cond, user)
            if logic == 'OR':
                q_obj |= sub_q
            else:
                q_obj &= sub_q
        else:
            # Single condition
            field = cond.get('field')
            operator = cond.get('operator', 'exact')
            value = cond.get('value')
            
            # Prepare the Q object for this single condition
            current_cond_q = Q()

            if field in ['owner', 'assigned_to']:
                if isinstance(value, list):
                    # Handle multiple users
                    resolved_values = []
                    for v in value:
                        if v == 'me' and user:
                            resolved_values.append(user.id)
                        else:
                            resolved_values.append(v)
                    current_cond_q = Q(**{f"{field}__in": resolved_values})
                elif value == 'me' and user:
                    current_cond_q = Q(**{field: user})
                else:
                    current_cond_q = Q(**{field: value})
            else:
                # Construct the lookup string, e.g., 'name__icontains'
                if operator == 'isnull':
                    # Ensure value is boolean for isnull
                    bool_value = str(value).lower() == 'true' if not isinstance(value, bool) else value
                    lookup = f"{field}__isnull"
                    current_cond_q = Q(**{lookup: bool_value})
                elif operator == 'in':
                    # Ensure value is a list for in
                    list_value = value if isinstance(value, list) else [value]
                    lookup = f"{field}__in"
                    current_cond_q = Q(**{lookup: list_value})
                elif operator == 'today':
                    from django.utils import timezone
                    today = timezone.now().date()
                    lookup = f"{field}__date"
                    current_cond_q = Q(**{lookup: today})
                elif operator == 'yesterday':
                    from django.utils import timezone
                    from datetime import timedelta
                    yesterday = timezone.now().date() - timedelta(days=1)
                    lookup = f"{field}__date"
                    current_cond_q = Q(**{lookup: yesterday})
                elif operator == 'tomorrow':
                    from django.utils import timezone
                    from datetime import timedelta
                    tomorrow = timezone.now().date() + timedelta(days=1)
                    lookup = f"{field}__date"
                    current_cond_q = Q(**{lookup: tomorrow})
                elif operator == 'after_today':
                    from django.utils import timezone
                    today = timezone.now().date()
                    lookup = f"{field}__date__gt"
                    current_cond_q = Q(**{lookup: today})
                elif operator == 'before_today':
                    from django.utils import timezone
                    today = timezone.now().date()
                    lookup = f"{field}__date__lt"
                    current_cond_q = Q(**{lookup: today})
                elif operator == 'past_n_days':
                    from django.utils import timezone
                    from datetime import timedelta
                    n = int(value) if value else 0
                    start_date = timezone.now() - timedelta(days=n)
                    lookup = f"{field}__gte"
                    current_cond_q = Q(**{lookup: start_date})
                elif operator == 'future_n_days':
                    from django.utils import timezone
                    from datetime import timedelta
                    n = int(value) if value else 0
                    end_date = timezone.now() + timedelta(days=n)
                    lookup = f"{field}__lte"
                    current_cond_q = Q(**{lookup: end_date})
                elif operator == 'between':
                    # Expecting value to be a list [start, end]
                    if isinstance(value, list) and len(value) == 2:
                        lookup = f"{field}__range"
                        current_cond_q = Q(**{lookup: value})
                    else:
                        current_cond_q = Q()
                else:
                    lookup = f"{field}__{operator}" if operator != 'exact' else field
                    current_cond_q = Q(**{lookup: value})
            
            # Combine with the main q_obj based on logic
            if logic == 'OR':
                q_obj |= current_cond_q
            else:
                q_obj &= current_cond_q
                
    return q_obj
