from django.contrib import admin, messages
from .models import Pedido, Usuario, Producto, Mesa, GaleriaFoto, ConfiguracionGeneral, ActividadReciente
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# from .models import Rol, Categoria, Usuario, Producto, Mesa, Pedido, Reserva
from .forms import CustomUserCreationForm, CustomUserChangeForm, ProductoAdminForm
from django.contrib.admin.utils import flatten_fieldsets
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils.html import mark_safe
from django.db.models import Q
from admin_personalizado.admin import custom_admin_site
from django.db import IntegrityError
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.template.loader import get_template
import os
from django.http import HttpResponse
from io import BytesIO
from xhtml2pdf import pisa
from django.utils.translation import ngettext
import datetime
from collections import defaultdict

# --- Clase UsuarioAdmin ---
@admin.register(Usuario, site=custom_admin_site)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active', 'date_joined', 'acciones')
    list_filter = ('is_active', 'rol',) # Quita 'is_staff', 'is_superuser' si ya no son relevantes en la UI
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

    add_form = CustomUserCreationForm
    form = CustomUserChangeForm

    # Definir los fieldsets directamente sin los campos de permisos avanzados
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'email', 'telefono', 'avatar')}),
        ('Roles y Permisos', {'fields': ('rol', 'is_active')}), # Solo rol y is_active
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('last_login', 'date_joined')

    def get_add_fieldsets(self, request, obj=None):
        # Para la vista de añadir, solo mostramos los campos relevantes
        return (
            (None, {
                'classes': ('wide',),
                'fields': ('username', 'email', 'first_name', 'last_name', 'rol', 'password', 'telefono', 'avatar'),
            }),
        )

    def get_fieldsets(self, request, obj=None):
        # Esta función ahora no necesita filtrar, porque los fieldsets ya no incluyen
        # is_staff, is_superuser, groups, user_permissions.
        # Simplemente devolvemos los fieldsets definidos en la clase.
        return self.fieldsets
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        if obj: # Si estamos editando un usuario existente
            # --- Reglas para is_active ---
            if 'is_active' in form.base_fields:
                # Si el usuario es superusuario o es el propio usuario que edita
                if obj.is_superuser or obj == request.user:
                    form.base_fields['is_active'].disabled = True
                    form.base_fields['is_active'].help_text = "No puedes deshabilitar un superusuario o tu propia cuenta."
                # Si el usuario a editar es un administrador y no el superusuario que edita
                elif obj.rol == 'administrador' and not request.user.is_superuser:
                    form.base_fields['is_active'].disabled = True
                    form.base_fields['is_active'].help_text = "Solo un superusuario puede deshabilitar otras cuentas de administrador."

            # --- Reglas para el campo 'rol' (menú cascada) ---
            if 'rol' in form.base_fields:
                # Si el usuario a editar es un superusuario, no se puede cambiar su rol
                if obj.is_superuser:
                    form.base_fields['rol'].disabled = True
                    form.base_fields['rol'].help_text = "No se puede cambiar el rol de un superusuario."
                # Si un administrador (no superusuario) intenta editar el rol de otro administrador
                elif obj.rol == 'administrador' and not request.user.is_superuser:
                    form.base_fields['rol'].disabled = True
                    form.base_fields['rol'].help_text = "Solo un superusuario puede cambiar el rol de otros administradores."

            # Los campos 'is_staff', 'is_superuser', 'groups', 'user_permissions'
            # ya no se necesitan deshabilitar aquí si ya los quitamos de los fieldsets.
            # Sin embargo, si por alguna razón siguen apareciendo, o si quieres ser
            # extra-seguro ante manipulaciones del formulario, puedes dejarlos aquí.
            # Pero la forma más limpia es quitarlos de los fieldsets.
        
        return form

    # =======================================================================
    # LÓGICA DE VALIDACIÓN CRÍTICA EN EL BACKEND (save_model)
    # =======================================================================
    def save_model(self, request, obj, form, change):
        # Si es un cambio (edición de un usuario existente)
        if change: 
            original_obj = Usuario.objects.get(pk=obj.pk) # Obtener el objeto antes de los cambios

            # --- VALIDACIÓN DE is_active (Estado Activo/Inactivo) ---
            # Si el estado 'is_active' ha cambiado y se está intentando deshabilitar
            if 'is_active' in form.changed_data and not obj.is_active:
                # 1. Proteger superusuarios: Un superusuario NO puede ser deshabilitado por NADIE.
                if original_obj.is_superuser:
                    messages.error(request, "No se puede deshabilitar una cuenta de superusuario.")
                    obj.is_active = True # Revertir el cambio
                    return # Detener el proceso de guardado

                # 2. Proteger al usuario que está logueado: No puede deshabilitarse a sí mismo.
                if obj == request.user:
                    messages.error(request, "No puedes deshabilitar tu propia cuenta.")
                    obj.is_active = True # Revertir el cambio
                    return # Detener el proceso de guardado

                # 3. Proteger la última cuenta de administrador (no superusuario):
                if original_obj.rol == 'administrador' and not original_obj.is_superuser:
                    active_admins_count = Usuario.objects.filter(
                        rol='administrador', is_active=True, is_superuser=False
                    ).exclude(pk=obj.pk).count()

                    if active_admins_count == 0:
                        messages.error(request, "No puedes deshabilitar al último administrador activo del sistema.")
                        obj.is_active = True # Revertir el cambio
                        return # Detener el proceso de guardado
            
            # --- VALIDACIÓN DE CAMBIO DE ROL ---
            if 'rol' in form.changed_data:
                new_rol = form.cleaned_data['rol']
                old_rol = original_obj.rol

                # 1. Proteger superusuarios: No se puede cambiar el rol de un superusuario
                if original_obj.is_superuser:
                    messages.error(request, "No se puede cambiar el rol de un superusuario.")
                    obj.rol = old_rol # Revertir el cambio
                    return # Detener el proceso de guardado
                
                # 2. Si se intenta degradar un administrador (no superusuario) a 'mesero'
                if old_rol == 'administrador' and new_rol == 'mesero':
                    active_admins_count = Usuario.objects.filter(
                        rol='administrador', is_active=True, is_superuser=False
                    ).exclude(pk=obj.pk).count()

                    if active_admins_count == 0:
                        messages.error(request, "No puedes degradar a este usuario, ya que es el último administrador activo del sistema.")
                        obj.rol = old_rol # Revertir el cambio
                        return # Detener el proceso de guardado

            # --- Protección de 'is_staff' y 'is_superuser' (Aunque se quiten de los fieldsets,
            #     es buena práctica tener una protección en el backend en caso de manipulación) ---
            # Asegúrate de que los campos `is_staff` y `is_superuser` no se cambien si el usuario no es superuser
            if not request.user.is_superuser:
                # Si el original era superusuario y se intenta cambiar
                if original_obj.is_superuser and not obj.is_superuser:
                    messages.error(request, "Solo un superusuario puede revocar el estado de superusuario.")
                    obj.is_superuser = True # Mantener el estado original
                
                # Si el original era staff y se intenta cambiar
                if original_obj.is_staff and not obj.is_staff:
                    messages.error(request, "Solo un superusuario puede revocar el estado de staff.")
                    obj.is_staff = True # Mantener el estado original
                
                # Si un usuario no superusuario intenta convertir a alguien en staff o superuser
                if not original_obj.is_staff and obj.is_staff:
                     messages.error(request, "Solo un superusuario puede conceder el estado de staff.")
                     obj.is_staff = False
                if not original_obj.is_superuser and obj.is_superuser:
                     messages.error(request, "Solo un superusuario puede conceder el estado de superusuario.")
                     obj.is_superuser = False


        # Si todas las validaciones pasan, llamar al save_model original
        super().save_model(request, obj, form, change)
        
        # Registrar la actividad después de guardar (si el guardado fue exitoso)
        if change:
            accion_desc = f'Modificó el Usuario {obj.username} (ID: {obj.id}).'
        else:
            accion_desc = f'Creó el Usuario {obj.username} (ID: {obj.id}).'
        ActividadReciente.objects.create(usuario=request.user, accion=accion_desc)

    # =======================================================================
    # LÓGICA DE VALIDACIÓN CRÍTICA PARA ELIMINACIÓN INDIVIDUAL (delete_view)
    # =======================================================================
    def delete_view(self, request, object_id, extra_context=None):
        obj = get_object_or_404(Usuario, pk=object_id)

        # 1. Proteger superusuarios: No se puede eliminar un superusuario por NADIE.
        if obj.is_superuser:
            messages.error(request, "No se puede eliminar una cuenta de superusuario.")
            return self.response_change(request, obj) # o self.response_post_save_change(request, obj)
            
        # 2. Proteger al usuario que está logueado: No puede eliminarse a sí mismo.
        if obj == request.user:
            messages.error(request, "No puedes eliminar tu propia cuenta.")
            return self.response_change(request, obj)

        # 3. Proteger la última cuenta de administrador (no superusuario):
        if obj.rol == 'administrador' and not obj.is_superuser:
            active_admins_count = Usuario.objects.filter(
                rol='administrador', is_active=True, is_superuser=False
            ).exclude(pk=obj.pk).count()

            if active_admins_count == 0:
                messages.error(request, "No puedes eliminar a este usuario, ya que es el último administrador activo del sistema.")
                return self.response_change(request, obj)

        # Si todas las validaciones pasan, proceder con la eliminación por defecto
        return super().delete_view(request, object_id, extra_context)

    # =======================================================================
    # LÓGICA DE VALIDACIÓN CRÍTICA PARA ELIMINACIÓN MASIVA (delete_selected)
    # =======================================================================
    def delete_selected(self, request, queryset):
        # Usuarios que NO pueden ser eliminados: superusuarios, el propio usuario logueado,
        # o el último administrador activo (no superusuario).
        
        non_deletable_pks = set()
        
        remaining_active_admins = Usuario.objects.filter(
            rol='administrador', is_active=True, is_superuser=False
        ).exclude(pk__in=queryset.values_list('pk', flat=True))

        # Si el queryset contiene administradores y el sistema se quedaría sin administradores activos
        selected_admins = queryset.filter(rol='administrador', is_superuser=False)
        if selected_admins.exists() and not remaining_active_admins.exists():
            for user_to_delete in selected_admins:
                non_deletable_pks.add(user_to_delete.pk)
        
        # Añadir superusuarios y al propio usuario a la lista de no eliminables
        for user_to_delete in queryset:
            if user_to_delete.is_superuser:
                non_deletable_pks.add(user_to_delete.pk)
            if user_to_delete.pk == request.user.pk:
                non_deletable_pks.add(user_to_delete.pk)
        
        deletable_queryset = queryset.exclude(pk__in=list(non_deletable_pks))
        
        non_deletable_count = queryset.count() - deletable_queryset.count()

        if non_deletable_count > 0:
            messages.warning(request, ngettext(
                "No se pudo eliminar %d usuario porque es una cuenta de superusuario, el último administrador activo o tu propia cuenta.",
                "No se pudieron eliminar %d usuarios porque son cuentas de superusuario, los últimos administradores activos o tus propias cuentas.",
                non_deletable_count
            ) % non_deletable_count)

        if deletable_queryset.exists():
            deleted_count, _ = deletable_queryset.delete()
            self.message_user(request, ngettext(
                "%d usuario fue eliminado exitosamente.",
                "%d usuarios fueron eliminados exitosamente.",
                deleted_count
            ) % deleted_count, messages.SUCCESS)

            for obj in deletable_queryset: # Registrar solo los que sí se eliminaron
                ActividadReciente.objects.create(
                    usuario=request.user,
                    accion=f'Eliminó el Usuario {obj.username} (ID: {obj.id}).'
                )
        else:
            messages.info(request, "Ningún usuario seleccionado pudo ser eliminado.")

    delete_selected.short_description = _("Eliminar usuarios seleccionados")


    # =======================================================================
    # LÓGICA PARA has_delete_permission (Controla el botón "Eliminar" y la acción)
    # =======================================================================
    def has_delete_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        
        if obj: # Si estamos en la vista de edición de un objeto específico
            # Un superusuario NO puede ser eliminado por nadie.
            # Ni el propio usuario logueado.
            # Ni el último administrador activo.
            
            # Si el objeto es un superusuario, no se puede eliminar.
            if obj.is_superuser:
                return False
            # Si el objeto es el usuario que está logueado, no se puede eliminar a sí mismo.
            if obj == request.user:
                return False
            # Si el objeto es un administrador (no superusuario) y es el último activo
            if obj.rol == 'administrador' and not obj.is_superuser:
                # Contar los administradores activos EXCLUYENDO el que se está evaluando
                active_admins_count = Usuario.objects.filter(
                    rol='administrador', is_active=True, is_superuser=False
                ).exclude(pk=obj.pk).count()
                if active_admins_count == 0:
                    return False # No se puede eliminar al último administrador
            
            # Si el usuario logueado no es superusuario y el objeto a eliminar es un administrador
            if not request.user.is_superuser and obj.rol == 'administrador':
                return False # Un administrador normal no puede eliminar a otros administradores
                
            return True # Si no cayó en ninguna de las restricciones anteriores
        
        # Para la vista de lista (acciones masivas o el botón general de "Eliminar")
        # Por defecto, Django permite eliminar si tienes el permiso global.
        # La lógica de 'delete_selected' manejará las restricciones de qué objetos se pueden eliminar.
        # Aquí, simplemente devolvemos el permiso base si es un superusuario.
        # Si no es superusuario, puede que quieras que el botón global de eliminar no aparezca.
        return request.user.is_superuser # Solo superusuarios ven el botón general de eliminar en la lista



    def changelist_view(self, request, extra_context=None):
        
        self.request = request 
        extra_context = extra_context or {}
        # Añadir la URL para descargar todos los usuarios en PDF al contexto
        download_all_users_url = reverse('admin:{}_{}_all_users_pdf'.format(self.model._meta.app_label, self.model._meta.model_name))
        extra_context['download_all_users_pdf_url'] = download_all_users_url
        return super().changelist_view(request, extra_context=extra_context)

    def acciones(self, obj):
        app_label = obj._meta.app_label
        model_name = obj._meta.model_name
        edit_url = reverse(f'admin:{app_label}_{model_name}_change', args=[obj.pk])
        delete_url = reverse(f'admin:{app_label}_{model_name}_delete', args=[obj.pk])
        pdf_url = reverse(f'admin:{app_label}_{model_name}_download_pdf', args=[obj.pk])
        
        # Determinar si el botón de eliminar debe ser visible para este objeto
        # Usamos self.request que ya está disponible después de changelist_view
        can_delete = self.has_delete_permission(self.request, obj)

        delete_button_html = ""
        if can_delete:
            delete_button_html = format_html(
                '<a class="button action-delete" href="{}"><i class="fa fa-trash"></i> Eliminar</a>&nbsp;',
                delete_url
            )
        else:
            delete_button_html = format_html(
                '<button class="button action-delete disabled" disabled title="No puedes eliminar este usuario."><i class="fa fa-ban"></i> Eliminar</button>&nbsp;'
            )

        return format_html(
            '<a class="button action-edit" href="{}"><i class="fa fa-pencil"></i> Editar</a>&nbsp;' 
            '{}' # Aquí insertamos el HTML del botón de eliminar (habilitado o deshabilitado)
            '<a class="button action-download-pdf" href="{}"><i class="fa fa-download"></i> Descargar PDF</a>',
            edit_url, 
            delete_button_html,
            pdf_url  
        )
        
    acciones.short_description = 'Acciones'
    acciones.allow_tags = True

    class Media:
        css = {
            'all': ('admin_personalizado/css_panel/acc_user.css',)
        }

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:object_id>/download_pdf/',
                 self.admin_site.admin_view(self.download_user_pdf_view),
                 name='{}_{}_download_pdf'.format(self.model._meta.app_label, self.model._meta.model_name)),
            
            # Nueva URL para descargar todos los usuarios
            path('download_all_users_pdf/',
                 self.admin_site.admin_view(self.download_users_pdf_all_view),
                 name='{}_{}_all_users_pdf'.format(self.model._meta.app_label, self.model._meta.model_name)),

        ]
        return custom_urls + urls

    def download_user_pdf_view(self, request, object_id):
        usuario = get_object_or_404(Usuario, pk=object_id)
        context = {
            'title': f'Reporte de Usuario: {usuario.username}',
            'usuario': usuario,
            'request': request,
            'STATIC_URL': settings.STATIC_URL,
            'MEDIA_URL': settings.MEDIA_URL,
            'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        filename = f"reporte_usuario_{usuario.username}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response = render_to_pdf('pages/Admin/usuarios_pdf.html', context)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    # NUEVA VISTA PARA DESCARGAR TODOS LOS USUARIOS EN PDF
    def download_users_pdf_all_view(self, request):
        # Obtener los usuarios del queryset actual (considera filtros/búsquedas si es necesario)
        # Por ahora, se obtienen todos. Si quieres que respete los filtros de la lista,
        # deberías usar self.get_queryset(request)
        users_to_pdf = Usuario.objects.all().order_by('username')

        # PROCESAR CADA USUARIO PARA INSERTAR EL SALTO DE LÍNEA EN EL EMAIL
        processed_users = []
        for user in users_to_pdf:
            user_data = {
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                # === ESTA ES LA LÍNEA CLAVE PARA EL SALTO DE LÍNEA EN EL EMAIL ===
                'email': user.email.replace('@', '<br>@'),
                # =================================================================
                'rol': user.get_rol_display(), # Usa get_rol_display() para el valor legible del rol
                'is_active': user.is_active,
                'date_joined': user.date_joined,
            }
            processed_users.append(user_data)

        template_path = 'pages/Admin/usuarios_lista_pdf.html'
        context = {
            'title': 'Reporte General de Usuarios',
            'users': processed_users, # Pasa la lista de usuarios PROCESADOS
            'request': request,
            'STATIC_URL': settings.STATIC_URL,
            'MEDIA_URL': settings.MEDIA_URL,
            'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        # Renderizar la plantilla HTML
        template = get_template(template_path)
        html = template.render(context)

        # Crear la respuesta HTTP de tipo PDF
        response = HttpResponse(content_type='application/pdf')
        filename = f"reporte_usuarios_general_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        # Generar el PDF
        pisa_status = pisa.CreatePDF(
            html,                # HTML a convertir
            dest=response,       # Manejador de archivo para recibir el resultado
            link_callback=self.link_callback # Usar un callback para manejar STATIC_URL y MEDIA_URL
        )
        if pisa_status.err:
            return HttpResponse('Error al generar el PDF: <pre>' + html + '</pre>')
        return response

# Callback para xhtml2pdf para resolver rutas de archivos estáticos y de medios
    def link_callback(self, uri, rel):
        """
        Convierte rutas HTML a rutas de sistema de archivos para xhtml2pdf.
        """
        # Rutas de archivos estáticos
        if uri.startswith(settings.STATIC_URL):
            path = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))
        # Rutas de archivos de medios
        elif uri.startswith(settings.MEDIA_URL):
            path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
        else:
            return uri  # Devolver la URI original si no es estática ni de medios
        
        # Asegúrate de que la ruta exista antes de devolverla
        if not os.path.isfile(path):
            # Opcional: registrar el error si el archivo no se encuentra
            # print(f"WARNING: File not found: {path}")
            pass
        return path


# --- Clase ProductoAdmin ---
@admin.register(Producto, site=custom_admin_site)
class ProductoAdmin(admin.ModelAdmin):
    form = ProductoAdminForm 
     
    list_display = ('titulo', 'precio','cantidad_disponible', 'get_estado_display','get_categoria_display','acciones',)
    list_filter = ('estado', 'categoria',)
    search_fields = ('titulo', 'descripcion','categoria')
    ordering = ('titulo',)

    fields = ('titulo', 'descripcion', 'precio', 'cantidad_disponible', 'estado', 'foto', 'categoria', 'opciones')

    def get_estado_display(self, obj):
        display_value = obj.get_estado_display()
        if obj.estado == 'disponible':
            return format_html('<span style="color: green; font-weight: bold;">{}</span>', display_value)
        elif obj.estado == 'no_disponible':
            return format_html('<span style="color: red; font-weight: bold;">{}</span>', display_value)
        return display_value

    get_estado_display.short_description = 'Estado'

    def acciones(self, obj):
        app_label = obj._meta.app_label
        model_name = obj._meta.model_name
        edit_url = reverse(f'admin:{app_label}_{model_name}_change', args=[obj.pk])
        delete_url = reverse(f'admin:{app_label}_{model_name}_delete', args=[obj.pk])
        pdf_url = reverse(f'admin:{app_label}_{model_name}_download_pdf', args=[obj.pk])

        return format_html(
            '<a class="button action-edit" href="{}"><i class="fa fa-pencil"></i> Editar</a>&nbsp;'
            '<a class="button deletelink custom-delete-button" href="{}" data-object-name="{}"><i class="fa fa-trash"></i> Eliminar</a>&nbsp;' 
            '<a class="button action-download-pdf" href="{}"><i class="fa fa-download"></i> Descargar PDF</a>',
            edit_url,
            delete_url,
            # obj,
            obj.pk, 
            pdf_url
        )
        
    acciones.short_description = 'Acciones'
    acciones.allow_tags = True

    def get_categoria_display(self, obj):
        return obj.get_categoria_display()

    get_categoria_display.short_description = 'Categoría'

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['categorias'] = Producto.CATEGORIAS
        return super().changelist_view(request, extra_context=extra_context)

    class Media:
        css = {
            'all': ('admin_personalizado/css_panel/agregar_forms.css','admin_personalizado/css_panel/acc_user.css')
        }

    def delete_selected(self, request, queryset):
        deleted_count, _ = queryset.delete()
        self.message_user(request, ngettext(
            "%d producto fue eliminado exitosamente.",
            "%d productos fueron eliminados exitosamente.",
            deleted_count
        ) % deleted_count, messages.SUCCESS)

        for obj in queryset:
            ActividadReciente.objects.create(
                usuario=request.user,
                accion=f'Eliminó el Producto {obj.titulo} (ID: {obj.id}).'
            )

    delete_selected.short_description = _("Eliminar productos seleccionados")
    
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:object_id>/download_pdf/', # Usamos object_id para ser genéricos
                 self.admin_site.admin_view(self.download_product_pdf_view),
                 name='{}_{}_download_pdf'.format(self.model._meta.app_label, self.model._meta.model_name)),
            
            path('download_all_products_by_category_pdf/',
                 self.admin_site.admin_view(self.download_products_pdf_all),
                 name='{}_{}_all_by_category_pdf'.format(self.model._meta.app_label, self.model._meta.model_name)),
        ]
        return custom_urls + urls

    def download_product_pdf_view(self, request, object_id):
        producto = get_object_or_404(Producto, pk=object_id) 
        context = {
            'title': f'Reporte de Producto: {producto.titulo}',
            'producto': producto, 
            'request': request,
            'STATIC_URL': settings.STATIC_URL,
            'MEDIA_URL': settings.MEDIA_URL,
            'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        filename = f"reporte_producto_{producto.titulo}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response = render_to_pdf('pages/Admin/productos_pdf.html', context) # <-- Nueva plantilla
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    
    def download_products_pdf_all(sefl, request,):
        all_products = Producto.objects.all().order_by('categoria', 'titulo')

        # Agrupar productos por categoría
        products_by_category = defaultdict(list)
        for product in all_products:
            category_name = product.get_categoria_display()
            products_by_category[category_name].append(product)

        sorted_categories = sorted(products_by_category.items(), key=lambda item: item[0])

        context = {
            'title': 'Reporte General de Productos por Categoría',
            'categories_data': sorted_categories, # Pasamos los productos agrupados por categoría
            'request': request,
            'STATIC_URL': settings.STATIC_URL,
            'MEDIA_URL': settings.MEDIA_URL,
            'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }

        filename = f"reporte_productos_por_categoria_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        # Usamos una nueva plantilla para este reporte agrupado
        response = render_to_pdf('pages/Admin/productos_lista_pdf.html', context)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        extra_context['categorias'] = Producto.CATEGORIAS

        # URL para el botón de descarga global
        download_url = reverse('admin:{}_{}_all_by_category_pdf'.format(self.model._meta.app_label, self.model._meta.model_name))
        extra_context['download_products_pdf_all'] = download_url
        return super().changelist_view(request, extra_context=extra_context)



# --- Clase GaleriaFotoAdmin ---
@admin.register(GaleriaFoto, site= custom_admin_site)
class GaleriaFotoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'get_uso_display', 'fecha_subida', 'admin_thumbnail_preview', 'acciones',)
    list_filter = ('uso', 'fecha_subida')
    search_fields = ('titulo', 'descripcion')
    readonly_fields = ('fecha_subida', 'admin_thumbnail_preview')

    fieldsets = (
        (None, {
            'fields': ('titulo', 'imagen', 'descripcion', 'uso'),
        }),
    )

    def admin_thumbnail_preview(self, obj):
        if obj.imagen:
            return mark_safe(f'<img src="{obj.imagen.url}" width="100" height="auto" style="border-radius: 5px;" />')
        return "No Image"
    admin_thumbnail_preview.short_description = 'Miniatura'

    def acciones(self, obj):
        app_label = obj._meta.app_label
        model_name = obj._meta.model_name
        edit_url = reverse(f'admin:{app_label}_{model_name}_change', args=[obj.pk])
        delete_url = reverse(f'admin:{app_label}_{model_name}_delete', args=[obj.pk])
        return format_html(
            '<a class="button action-edit" href="{}"><i class="fa fa-pencil"></i> Editar</a>&nbsp;'
            '<a class="button deletelink custom-delete-button" href="{}" data-object-name="{}"><i class="fa fa-trash"></i> Eliminar</a>',
            edit_url,
            delete_url,
            obj
        )
    acciones.short_description = 'Acciones'

    def get_uso_display(self, obj):
        display_value = obj.get_uso_display()
        if obj.uso == 'en_uso':
            return format_html('<span style="color: green; font-weight: bold;">{}</span>', display_value)
        elif obj.uso == 'no_en_uso':
            return format_html('<span style="color: red; font-weight: bold;">{}</span>', display_value)
        return display_value
    get_uso_display.short_description = 'Estado de Uso'

    def save_model(self, request, obj, form, change):
        if obj.uso == 'en_uso':
            en_uso_count = GaleriaFoto.objects.filter(uso='en_uso').exclude(pk=obj.pk).count()
            if en_uso_count >= 2:
                messages.error(request, '¡Error! Solo se pueden tener 2 imágenes "En Uso" a la vez. Desactiva otra imagen primero.')
                return
        super().save_model(request, obj, form, change)

    class Media:
        css = {
            'all': (
                'admin_personalizado/css_panel/acc_user.css',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
            )
        }

    # --- SOBRESCRIBIR LA ACCIÓN 'delete_selected' ---
    def delete_selected(self, request, queryset):
        deleted_count, _ = queryset.delete()
        self.message_user(request, ngettext(
            "%d foto de galería fue eliminada exitosamente.",
            "%d fotos de galería fueron eliminadas exitosamente.",
            deleted_count
        ) % deleted_count, messages.SUCCESS)

        for obj in queryset:
            ActividadReciente.objects.create(
                usuario=request.user,
                accion=f'Eliminó la foto de galería "{obj.titulo}" (ID: {obj.id}).'
            )

    delete_selected.short_description = _("Eliminar fotos seleccionadas")


# --- Clase MesaAdmin ---
@admin.register(Mesa, site=custom_admin_site)
class MesaAdmin(admin.ModelAdmin):
    list_display = ('numero', 'capacidad', 'estado', 'is_active', 'total_pedido_actual', 'fecha_ultima_actividad', 'acciones_mesa')
    list_filter = ('is_active', 'estado', 'capacidad')
    search_fields = ('numero',)
    actions = ['activar_mesas_seleccionadas', 'desactivar_mesas_seleccionadas'] # Mantén estas acciones
    list_editable = ('is_active',)

    def fecha_ultima_actividad(self, obj):
        ultimo_pedido = obj.pedido_set.order_by('-fecha').first()
        if ultimo_pedido:
            return ultimo_pedido.fecha.strftime('%Y-%m-%d %H:%M')
        return "N/A"
    fecha_ultima_actividad.short_description = "Última Actividad"

    def total_pedido_actual(self, obj):
        ultimo_pedido_pendiente = obj.pedido_set.filter(estado='pendiente').order_by('-fecha').first()
        if ultimo_pedido_pendiente:
            return f"${ultimo_pedido_pendiente.total:.2f}"
        return "N/A"
    total_pedido_actual.short_description = 'Total Pedido Actual'

    def acciones_mesa(self, obj):
        app_label = obj._meta.app_label
        model_name = obj._meta.model_name
        edit_url = reverse(f'admin:{app_label}_{model_name}_change', args=[obj.pk])
        pedidos_url = reverse('admin:%s_%s_changelist' % (obj._meta.app_label, 'pedido')) + f'?mesa__id__exact={obj.pk}'
        return format_html(
            '<a class="button action-edit" href="{}"><i class="fa fa-pencil"></i> Editar Mesa</a>&nbsp;'
            '<a class="button action-view" href="{}"><i class="fa fa-eye"></i> Ver Pedidos</a>',
            edit_url,
            pedidos_url
        )
    acciones_mesa.short_description = 'Acciones'

    def activar_mesas_seleccionadas(self, request, queryset):
        config = ConfiguracionGeneral.objects.first()
        if not config:
            self.message_user(request, "Error: No se ha configurado el límite de mesas activas.", level=messages.ERROR)
            return

        limite_mesas = config.limite_mesas
        mesas_activas_actuales = Mesa.objects.filter(is_active=True).count()
        mesas_a_activar = queryset.filter(is_active=False)

        num_activadas = 0
        for mesa in mesas_a_activar:
            if mesas_activas_actuales < limite_mesas:
                mesa.is_active = True
                mesa.save()
                num_activadas += 1
                mesas_activas_actuales += 1
                ActividadReciente.objects.create(
                    usuario=request.user,
                    accion=f'Activó la Mesa {mesa.numero} (ID: {mesa.id}).'
                )
            else:
                messages.warning(request, f"No se pudo activar la Mesa {mesa.numero}. Se alcanzó el límite de {limite_mesas} mesas activas.")
                break

        if num_activadas > 0:
            self.message_user(request, ngettext(
                '%d mesa fue activada correctamente.',
                '%d mesas fueron activadas correctamente.',
                num_activadas
            ) % num_activadas, messages.SUCCESS)
        else:
            messages.info(request, "Ninguna mesa seleccionada pudo ser activada debido al límite o ya estaban activas.")

    activar_mesas_seleccionadas.short_description = "Activar mesas seleccionadas"

    def desactivar_mesas_seleccionadas(self, request, queryset):
        count = queryset.update(is_active=False)
        for mesa in queryset:
            ActividadReciente.objects.create(
                usuario=request.user,
                accion=f'Desactivó la Mesa {mesa.numero} (ID: {mesa.id}).'
            )
        self.message_user(request, ngettext(
            '%d mesa fue desactivada correctamente.',
            '%d mesas fueron desactivadas correctamente.',
            count
        ) % count, messages.SUCCESS)

    desactivar_mesas_seleccionadas.short_description = "Desactivar mesas seleccionadas"

    @admin.display(
        description='Estado Activa',
        boolean=True,
    )
    def mostrar_estado_activo(self, obj):
        return obj.is_active

    class Media:
        css = {
            'all': ('admin_personalizado/css_panel/acc_user.css',)
        }

    # --- SOBRESCRIBIR LA ACCIÓN 'delete_selected' ---
    # Añade 'delete_selected' a la lista de actions si aún no está.
    actions = ['activar_mesas_seleccionadas', 'desactivar_mesas_seleccionadas', 'delete_selected']

    def delete_selected(self, request, queryset):
        deleted_count, _ = queryset.delete()
        self.message_user(request, ngettext(
            "%d mesa fue eliminada exitosamente.",
            "%d mesas fueron eliminadas exitosamente.",
            deleted_count
        ) % deleted_count, messages.SUCCESS)

        for obj in queryset:
            ActividadReciente.objects.create(
                usuario=request.user,
                accion=f'Eliminó la Mesa {obj.numero} (ID: {obj.id}).'
            )

    delete_selected.short_description = _("Eliminar mesas seleccionadas")


# --- Clase PedidoAdmin (No necesita sobrescribir delete_selected porque ya has deshabilitado has_delete_permission) ---
@admin.register(Pedido, site=custom_admin_site)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'mesa', 'fecha', 'estado', 'total_pedido_display', 'realizado_por', 'acciones_pedido')
    list_filter = ('estado', 'fecha', 'mesa')
    search_fields = ('id', 'mesa__numero__icontains', 'mesero__username__icontains')
    ordering = ('-fecha',)

    class Media:
        css = {
            'all': ('admin_personalizado/css_panel/acc_user.css',)
        }

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False # Correcto, deshabilitado para Pedidos

    def total_pedido_display(self, obj):
        return f"${obj.total:.2f}"
    total_pedido_display.short_description = _("Total del Pedido")

    def realizado_por(self, obj):
        return obj.mesero.username if obj.mesero else _("Desconocido")
    realizado_por.short_description = _("Realizado por")

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:pedido_id>/download_pdf/',
                 self.admin_site.admin_view(self.download_pedido_pdf_view),
                 name='{}_{}_download_pdf'.format(self.model._meta.app_label, self.model._meta.model_name)),
        ]
        return custom_urls + urls

    def acciones_pedido(self, obj):
        view_url = reverse('admin:{}_{}_change'.format(obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        pdf_url = reverse('admin:{}_{}_download_pdf'.format(obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html(
            '<a class="button action-view" href="{}"><i class="fa fa-eye"></i> Ver Contenido</a>&nbsp;'
            '<a class="button action-download" href="{}"><i class="fa fa-download"></i> Descargar PDF</a>',
            view_url,
            pdf_url
        )
    acciones_pedido.short_description = 'Acciones'

    def download_pedido_pdf_view(self, request, pedido_id):
        pedido = get_object_or_404(Pedido, pk=pedido_id)
        detalles_pedido = pedido.detalles.all()

        context = {
            'pedido': pedido,
            'detalles_pedido': detalles_pedido,
            'request': request,
            'STATIC_URL': settings.STATIC_URL,
            'MEDIA_URL': settings.MEDIA_URL,
        }
        response = render_to_pdf('pages/Admin/pedidos_pdf.html', context)
        response['Content-Disposition'] = f'attachment; filename="pedido_{pedido.id}.pdf"'
        return response

def render_to_pdf(template_src, context_dict={}):
    template = get_template(template_src)
    html = template.render(context_dict)
    response = BytesIO()

    def link_callback(uri, rel):
        if uri.startswith(settings.STATIC_URL):
            path = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))
        elif uri.startswith(settings.MEDIA_URL):
            path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
        else:
            return uri
        if not os.path.isfile(path):
            print(f"Advertencia: Archivo no encontrado para PDF: {path}")
            return uri
        return path

    pisa_status = pisa.CreatePDF(
        html,
        dest=response,
        link_callback=link_callback
    )
    if pisa_status.err:
        return HttpResponse('Tuvimos algunos errores al generar el PDF <pre>%s</pre>' % html, status=400)

    response_pdf = HttpResponse(response.getvalue(), content_type='application/pdf')
    return response_pdf




# Registros
# custom_admin_site.register(Pedido)
# admin.site.register(Inventario)
# custom_admin_site.register(Usuario, UsuarioAdmin)  # Con la clase personalizada
# custom_admin_site.register(Producto, ProductoAdmin)
# admin.site.register(Reserva)
# admin.site.register(ActividadReciente)
# admin.site.register(Perfil)
# custom_admin_site.register(GaleriaFoto,GaleriaFotoAdmin)
# custom_admin_site.register(Mesa)


