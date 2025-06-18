from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Usuario, Producto
from django.contrib.auth.forms import PasswordResetForm
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = Usuario 
        # INCLUIR password1 y password2 para los campos de contraseña
        fields = ('username', 'email', 'first_name', 'last_name', 'rol', 'password1', 'password2')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personalizar las etiquetas
        self.fields['first_name'].label = "Nombre"
        self.fields['last_name'].label = "Apellido"
        self.fields['password1'].label = "Contraseña"
        self.fields['password2'].label = "Confirmar Contraseña"
        
        # Aplicar clases CSS a todos los campos
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'   
           
class CustomUserChangeForm(UserChangeForm):
    class Meta: 
        model = Usuario
        fields = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['first_name'].label = "Nombre"
        self.fields['last_name'].label = "Apellido"
        self.fields['is_active'].label = "Estado activo"
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'  


class PasswordChangeForm(forms.Form):
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}), label="Nueva Contraseña")
    confirm_password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}), label="Confirmar Contraseña")
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')
        
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError("Las contraseñas no coinciden")
        return cleaned_data

class CustomPasswordResetForm(PasswordResetForm):
    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
      
        subject = render_to_string(subject_template_name, context).strip()
        body = render_to_string(email_template_name, context)
        email_message = EmailMultiAlternatives(subject, body, from_email, [to_email])
        if html_email_template_name:
            html_email = render_to_string(html_email_template_name, context)
            email_message.attach_alternative(html_email, 'text/html')
        email_message.send()

class ProductoAdminForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = '__all__'

    def clean_titulo(self):
        titulo = self.cleaned_data['titulo']
        titulo_lower = titulo.lower() 

        if Producto.objects.filter(titulo__iexact=titulo_lower).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("Ya existe un producto con este título .")
        
        return titulo
    
    # --- VALIDACIÓN MODIFICADA PARA cantidad_disponible ---
    def clean(self):
        """
        Este método clean general permite acceder a todos los campos del formulario.
        """
        cleaned_data = super().clean()
        cantidad_disponible = cleaned_data.get('cantidad_disponible')
        estado = cleaned_data.get('estado')


        if self.instance.pk is None and cantidad_disponible is not None and cantidad_disponible == 0:
            self.add_error('cantidad_disponible', "No puedes agregar un producto con 0 cantidad disponible. Ingresa una cantidad mayor a 0.")
            return cleaned_data 

        if cantidad_disponible is not None and cantidad_disponible == 0 and estado == 'disponible':
            self.add_error('cantidad_disponible', "Un producto con 0 cantidad disponible debe tener el estado 'No disponible'.")


        return cleaned_data