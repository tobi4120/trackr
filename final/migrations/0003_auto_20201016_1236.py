# Generated by Django 3.1 on 2020-10-16 17:36

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('final', '0002_collaborator'),
    ]

    operations = [
        migrations.AlterField(
            model_name='collaborator',
            name='collaborator_name',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, to_field='username'),
        ),
    ]