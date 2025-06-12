from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


Usuario = get_user_model()

class CustomAuthBackend(ModelBackend):
    """
    Backend de autenticación personalizado que permite iniciar sesión
    con nombre de usuario o correo electrónico.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        # Intentar autenticar por nombre de usuario
        try:
            user = Usuario.objects.get(username=username)
            if user.check_password(password):
                return user
        except Usuario.DoesNotExist:
            # Si no existe usuario con ese nombre, intenta con email
            try:
                user = Usuario.objects.get(email=username)
                if user.check_password(password):
                    return user
            except Usuario.DoesNotExist:
                return None
        
        return None