# Generated by Django 2.2 on 2020-11-08 07:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('styles', '0003_stylereview_comment'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='stylereview',
            options={'ordering': ['review_date']},
        ),
    ]
