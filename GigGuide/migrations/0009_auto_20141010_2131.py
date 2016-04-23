# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0008_auto_20141010_2128'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gig',
            name='date',
            field=models.DateField(),
        ),
    ]
