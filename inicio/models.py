from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone 


class usuario_manager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        if not username:
            raise ValueError('El nombre de usuario es obligatorio')
    
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
# class Rol(models.Model):
#     tipoRol = models.CharField(max_length=45)
#     def __str__(self):
#         return self.tipoRol

# class Categoria(models.Model):
#     nombreCategoria = models.CharField(max_length=50)
#     def __str__(self):
#         return self.nombreCategoria

    def crear_user(self, email, username, password=None, **extra_fields):
        """Alias para mantener compatibilidad con código existente"""
        return self.create_user(email, username, password, **extra_fields)

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('rol', 'Administrador')
    
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        
        return self.create_user(email, username, password, **extra_fields)

    def crear_superuser(self, email, username, password=None, **extra_fields):
        """Alias para mantener compatibilidad con código existente"""
        return self.create_superuser(email, username, password, **extra_fields)


class Usuario(AbstractUser):
    ROLES = (
        ('administrador', 'administrador'),
        ('mesero', 'mesero'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='Mesero')
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    # Los campos first_name, last_name, username, is_active, etc. ya vienen de AbstractUser
    
    objects = usuario_manager()
    
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    USERNAME_FIELD = 'username'  # o 'email' si prefieres usar el email como login

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"



class Mesa(models.Model):
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('ocupada', 'Ocupada'),
        ('limpieza', 'En Limpieza'),
    ]
    numero = models.IntegerField(unique=True, help_text="Número único de la mesa (ej. 1, 2, 3)")
    capacidad = models.IntegerField(help_text="Capacidad de personas que la mesa puede albergar")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='disponible')
    is_active = models.BooleanField(default=True, help_text="Indica si la mesa está activa para su uso.")

    class Meta:
        verbose_name = "Mesa"
        verbose_name_plural = "Mesas"
        ordering = ['numero']

    def __str__(self):
        # Muestra el número y si está activa o inactiva
        status = "Activa" if self.is_active else "Inactiva"
        return f"Mesa {self.numero} ({status})"





class Producto(models.Model):
    ESTADOS = [
        ('disponible', 'Disponible'),
        ('no_disponible', 'No disponible'),
    ]
    
    CATEGORIAS = [
        ('Coctel', 'Cócteles'),
        ('bebida_caliente', 'Bebidas Calientes'),
        ('Bebida_fria', 'Bebidas Frias'),
        ('Cerveza', 'Cervezas'),
        ('Cigarrillo', 'Cigarrillos'),
        ('Picar', 'Para Picar'),
        # Agrega más según tu necesidad
    ]

    titulo = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    cantidad_disponible = models.IntegerField(default=0, help_text="Cantidad de productos disponibles")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='disponible')
    foto = models.ImageField(upload_to='productos/')
    categoria = models.CharField(max_length=30, choices=CATEGORIAS)
    opciones = models.TextField(blank=True,help_text="Escribe las opciones separadas por comas. Ej: Capuchino vainilla, Capuchino caramelo") # lista de strings    
    
    
    categoria = models.CharField(
        max_length=50, # Ajusta la longitud máxima según tus categorías
        choices=CATEGORIAS,
        default='bebida_fria' # Establece un valor por defecto si lo deseas
    )
    
    def __str__(self):
        return self.titulo


# -------------------------PEDIDOS-------------------------------------------------------------
class Pedido(models.Model):
    ESTADO_PEDIDO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('finalizado', 'Finalizado'),
    ]
    
    mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_PEDIDO_CHOICES, default='pendiente')
    mesero = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    medio_pago = models.CharField(max_length=50)

    def __str__(self):
            return f"Pedido en mesa {self.mesa.numero} - ${self.total}"  # Modifiqué para mostrar el número de la mesa

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ['-fecha']
        ...
        


class PedidoDetalle(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    
    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario
    
    def __str__(self):
        return f"{self.cantidad} x {self.producto.titulo} para Pedido #{self.pedido.id}"

    class Meta:
        verbose_name = "Detalle de Pedido"
        verbose_name_plural = "Detalles de Pedidos"
        unique_together = ('pedido', 'producto')

# ---------------------------------------------------------------------------------------------------





User = get_user_model()

class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.user.username
    
    

class ActividadReciente(models.Model):
    accion = models.CharField(max_length=255)
    fecha_hora = models.DateTimeField(default=timezone.now)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-fecha_hora'] # Para que las actividades más recientes aparezcan primero

    def __str__(self):
        return f"{self.accion} por {self.usuario.username if self.usuario else 'Desconocido'} el {self.fecha_hora.strftime('%Y-%m-%d %H:%M')}"
    
    
class GaleriaFoto(models.Model):
    ESTADO_USO_CHOICES = [
        ('en_uso', 'En Uso'),       
        ('no_en_uso', 'No En Uso'), 
    ]

    titulo = models.CharField(max_length=100, blank=True, null=True)
    imagen = models.ImageField(upload_to='galeria/') 
    descripcion = models.TextField(blank=True, null=True)
    
    # Campo 'uso' con las choices definidas
    uso = models.CharField(
        max_length=20, 
        choices=ESTADO_USO_CHOICES, 
        default='no_en_uso' 
    )
    
    fecha_subida = models.DateTimeField(auto_now_add=True)

    # # Opcional: Para indicar si la foto debe mostrarse en la página principal
    # # Considera si este campo 'es_principal' es redundante con 'uso'
    # # Si 'uso' es para el index, quizás 'es_principal' ya no sea necesario.
    # es_principal = models.BooleanField(default=False) 

    def __str__(self):
        return self.titulo if self.titulo else f"Foto {self.id}"

    class Meta:
        verbose_name = "Foto de Galería"
        verbose_name_plural = "Fotos de Galería"
        # Esto asegura que las fotos más recientes aparezcan primero por defecto
        ordering = ['-fecha_subida']


class ConfiguracionGeneral(models.Model):
    # Límite máximo de mesas que el bar puede tener
    # Valor predeterminado de 15, mínimo 10, máximo 20 (se valida en el admin y la vista)
    limite_mesas = models.IntegerField(default=15) 

    class Meta:
        verbose_name = "Configuración General"
        verbose_name_plural = "Configuración General"

    def __str__(self):
        return "Configuración del Sistema"

    def save(self, *args, **kwargs):
        # Asegurar que solo haya una instancia de esta configuración
        if not self.pk and ConfiguracionGeneral.objects.exists():
            raise ValueError("Solo puede haber una instancia de Configuración General.")
        # Validar el límite de mesas antes de guardar
        if not (10 <= self.limite_mesas <= 20):
            raise ValueError("El límite de mesas debe estar entre 10 y 20.")
        super().save(*args, **kwargs)








    # from django.utils.html import mark_safe
    # def admin_thumbnail(self):
    #     if self.imagen:
    #         return mark_safe(f'<img src="{self.imagen.url}" width="100" height="auto" />')
    #     return "No Image"
    # admin_thumbnail.short_description = 'Miniatura'
    
