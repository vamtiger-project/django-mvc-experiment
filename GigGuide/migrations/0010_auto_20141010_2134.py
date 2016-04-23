# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0009_auto_20141010_2131'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='gig',
            options={'ordering': ['date', 'start']},
        ),
    ]
