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
                lookup = f"{field}__{operator}" if operator != 'exact' else field
                current_cond_q = Q(**{lookup: value})
            
            # Combine with the main q_obj based on logic
            if logic == 'OR':
                q_obj |= current_cond_q
            else:
                q_obj &= current_cond_q
                
    return q_obj
