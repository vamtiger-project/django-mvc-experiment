# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0013_auto_20141010_2214'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gig',
            name='reference_email',
            field=models.EmailField(max_length=100, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='gig',
            name='reference_telephone',
            field=models.CharField(max_length=12, null=True, blank=True),
        ),
    ]
