# admin_personalizado/admin.py

# Importaciones existentes
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _
from django.urls import path
from django.contrib.admin.models import LogEntry
from django.utils.html import format_html
import json
from django.shortcuts import render # Puede que no sea estrictamente necesario aquí si solo modificas el contexto
from django.template.response import TemplateResponse

# --- ¡NUEVAS IMPORTACIONES NECESARIAS! ---
from django.contrib.auth import get_user_model # Para obtener el modelo de usuario activo
from inicio.models import Producto, Usuario # Asegúrate de que esta ruta sea correcta para tus modelos

class CustomAdminSite(AdminSite):
    site_header = _("OMBÜ Café")
    site_title = _("Administración de OMBÜ")
    index_title = _("Sitio administrativo")

    def each_context(self, request):
        context = super().each_context(request)
        context['extra_css'] = 'admin_personalizado/admin.css'
        return context

    # MÉTODO INDEX REVISADO PARA MODIFICAR EL CONTEXTO CORRECTAMENTE
    def index(self, request, extra_context=None):
        # 1. Obtiene la TemplateResponse estándar del método index del padre.
        response = super().index(request, extra_context)

        # 2. Asegúrate de que la respuesta es una TemplateResponse.
        if not isinstance(response, TemplateResponse):
            return response

        # 3. Accede al diccionario de contexto de la respuesta para modificarlo.
        context_data = response.context_data

        # --- ¡LÓGICA PARA OBTENER Y AÑADIR LOS CONTADORES! ---
        # Cantidad de Productos
        try:
            cantidad_productos = Producto.objects.count()
            print(f"DEBUG (AdminSite): Cantidad de Productos obtenidos: {cantidad_productos}")
        except Exception as e:
            cantidad_productos = f"Error al obtener productos: {e}"
            print(f"ERROR (AdminSite - Productos): {cantidad_productos}") # Mensaje de error más claro

        # Cantidad de Usuarios
        User = get_user_model() # Obtiene el modelo de usuario configurado (inicio.Usuario en tu caso)
        try:
            cantidad_usuarios = User.objects.count()
            print(f"DEBUG (AdminSite): Cantidad de Usuarios obtenidos: {cantidad_usuarios}")
        except Exception as e:
            cantidad_usuarios = f"Error al obtener usuarios: {e}"
            print(f"ERROR (AdminSite - Usuarios): {cantidad_usuarios}") # Mensaje de error más claro

        # Añade los contadores al contexto_data
        context_data['cantidad_productos'] = cantidad_productos
        context_data['cantidad_usuarios'] = cantidad_usuarios
        # --- FIN DE LA LÓGICA DE CONTADORES ---

        # 4. Agrega tu lógica para obtener y formatear las actividades recientes (tal como la tenías).
        recent_activities = LogEntry.objects.order_by('-action_time')[:10]
        formatted_activities = []
        for entry in recent_activities:
            action_detail_message = ""
            action_description = ""
            object_display_name_text = entry.object_repr if entry.object_repr else _("un objeto desconocido")
            admin_url = entry.get_admin_url()

            if admin_url:
                object_display_name = format_html("<a href='{}'>{}</a>", admin_url, object_display_name_text)
            else:
                object_display_name = object_display_name_text

            if entry.is_addition():
                action_description = _(f"Añadido '{object_display_name}'")
            elif entry.is_change():
                action_description = _(f"Modificado '{object_display_name}'")
                if entry.change_message:
                    try:
                        message_data = json.loads(entry.change_message)
                        if isinstance(message_data, list):
                            for msg in message_data:
                                if 'changed' in msg and 'fields' in msg['changed']:
                                    changed_fields = ', '.join(msg['changed']['fields'])
                                    action_detail_message = _(f"Se actualizaron los campos: {changed_fields}.")
                                elif 'added' in msg and 'name' in msg['added'] and 'object' in msg['added']:
                                    added_name = msg['added']['name']
                                    added_object = msg['added']['object']
                                    action_detail_message = _(f"Se añadió '{added_object}' a '{added_name}'.")
                                elif 'deleted' in msg and 'name' in msg['deleted'] and 'object' in msg['deleted']:
                                    deleted_name = msg['deleted']['name']
                                    deleted_object = msg['deleted']['object']
                                    action_detail_message = _(f"Se eliminó '{deleted_object}' de '{deleted_name}'.")
                                elif isinstance(msg, dict) and msg.get('message'):
                                    action_detail_message = _(f"Detalles del cambio: {msg['message']}.")
                        elif isinstance(message_data, dict) and message_data.get('message'):
                            action_detail_message = _(f"Detalles del cambio: {message_data['message']}.")
                        else:
                            if entry.change_message.strip():
                                action_detail_message = _(f"Detalles del cambio: {entry.change_message.strip()}.")
                    except json.JSONDecodeError:
                        if entry.change_message.strip():
                            action_detail_message = _(f"Detalles del cambio: {entry.change_message.strip()}.")
                        else:
                            action_detail_message = _("No se especificaron detalles del cambio.")
                else:
                    action_detail_message = _("No se especificaron detalles del cambio.")
            elif entry.is_deletion():
                action_description = _(f"Eliminado '{object_display_name}'")
            else:
                action_description = _(f"Acción desconocida sobre '{object_display_name}'")

            final_action_text = action_description
            if action_detail_message:
                final_action_text += f": {action_detail_message}"
            final_action_text += f" por {entry.user.username}"

            formatted_activities.append({
                'accion': final_action_text,
                'fecha_hora': entry.action_time,
            })

        # 5. Agrega las actividades formateadas y tu variable de prueba al contexto_data.
        context_data['actividades_recientes'] = formatted_activities
        context_data['variable_prueba_simple'] = "¡Hola desde AdminSite MODIFICADO y PASADO!"
        context_data['title'] = 'Dashboard-OMBÚ' # Para el breadcrumbs

        # 6. Tus impresiones de depuración en la consola.
        print(f"DEBUG en admin.py (context_data modificada): actividades_recientes = {context_data['actividades_recientes']}")
        print(f"DEBUG en admin.py (context_data modificada): variable_prueba_simple = {context_data['variable_prueba_simple']}")

        # 7. Devuelve la TemplateResponse con el contexto modificado.
        return response

# Instancia de tu AdminSite personalizada
# Asegúrate de que este 'name' coincida con lo que usas en urls.py si lo has cambiado.
custom_admin_site = CustomAdminSite(name='customadmin') # Cambié a 'customadmin' para mayor claridad, verifica si tu urls.py usa 'sitio_admin_inicio'