# Generated by Django 5.2 on 2025-05-21 18:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inicio', '0012_remove_producto_modificado_usuario_avatar_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='rol',
            field=models.CharField(choices=[('administrador', 'administrador'), ('mesero', 'mesero')], default='Mesero', max_length=20),
        ),
    ]
