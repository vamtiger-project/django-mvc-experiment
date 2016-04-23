# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0007_auto_20141010_2124'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gig',
            name='date',
            field=models.DateField(verbose_name=b'date'),
        ),
    ]
