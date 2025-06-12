from django import template

register = template.Library()

@register.filter
def starts_with(value, arg):
    """
    Checks if a string 'value' starts with 'arg'.
    Usage: {{ key|starts_with:'fecha__' }}
    """
    return str(value).startswith(str(arg))