
from django.urls import path
from . import views
from .views import descargar_manual

app_name = 'admin_panel'

urlpatterns = [
    path('', views.custom_admin_index, name='index'),
    path('perfil/', views.perfil_view, name='perfil'),

    path('descargar-manual/', descargar_manual, name='descargar_manual'),

    
    path('backups/', views.lista_backups, name='lista_backups'),
    path('backups/crear/', views.crear_backup, name='crear_backup'),
    path('backups/restaurar/<str:nombre>/', views.restaurar_backup, name='restaurar_backup'),
    path('backups/eliminar/<str:nombre>/', views.eliminar_backup, name='eliminar_backup'),
    
    
    # # URL del Dashboard
    # path('dashboard/', views.dashboard, name='dashboard'),
    
]