from django.contrib.auth.decorators import user_passes_test
from django.core.exceptions import PermissionDenied



def group_required(group_name):
    """
    Decorador que permite el acceso a usuarios que pertenecen a un grupo específico.
    Si el usuario no está autenticado o no pertenece al grupo, se lanza un error 403.
    """
    def check_group(user):
        if user.is_authenticated and user.groups.filter(name=group_name).exists():
            return True
        raise PermissionDenied  # Esto lanza error 403 si el usuario no pertenece al grupo

    return user_passes_test(check_group)


def role_required(allowed_roles=[]):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if request.user.is_authenticated and request.user.rol in allowed_roles:
                return view_func(request, *args, **kwargs)
            else:
                raise PermissionDenied  # o puedes redirigir a otra vista si prefieres
        return wrapper
    return decorator


