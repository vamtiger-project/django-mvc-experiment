# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0003_auto_20141009_2231'),
    ]

    operations = [
        migrations.RenameField(
            model_name='gig',
            old_name='endTime',
            new_name='end',
        ),
        migrations.RenameField(
            model_name='gig',
            old_name='startTime',
            new_name='start',
        ),
    ]
