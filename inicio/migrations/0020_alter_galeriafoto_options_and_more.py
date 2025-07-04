# Generated by Django 5.2 on 2025-05-29 21:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inicio', '0019_galeriafoto_alter_producto_categoria'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='galeriafoto',
            options={'ordering': ['-fecha_subida'], 'verbose_name': 'Foto de Galería', 'verbose_name_plural': 'Fotos de Galería'},
        ),
        migrations.RemoveField(
            model_name='galeriafoto',
            name='es_principal',
        ),
        migrations.AddField(
            model_name='galeriafoto',
            name='uso',
            field=models.CharField(choices=[('en_uso', 'En Uso'), ('no_en_uso', 'No En Uso')], default='no_en_uso', max_length=20),
        ),
    ]
