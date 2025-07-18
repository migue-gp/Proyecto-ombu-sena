# Generated by Django 5.2 on 2025-06-13 21:49

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inicio', '0029_alter_producto_titulo'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='pedidodetalle',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='pedidodetalle',
            name='nombre_producto_historico',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='pedidodetalle',
            name='producto',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='inicio.producto'),
        ),
    ]
