# Generated by Django 3.1 on 2020-11-01 18:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('final', '0009_auto_20201101_1014'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='board',
            name='projects',
        ),
        migrations.AddField(
            model_name='project',
            name='boards',
            field=models.ManyToManyField(to='final.Board'),
        ),
    ]