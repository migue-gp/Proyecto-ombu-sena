from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class AdminPersonalizadoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_personalizado'

    # def ready(self):
    #     import admin_personalizado.signals



class InicioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inicio'
    verbose_name = _('Inicio') 