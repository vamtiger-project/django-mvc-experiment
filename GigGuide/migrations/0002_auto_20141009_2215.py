# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0001_squashed_0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='gig',
            old_name='starTime',
            new_name='startTime',
        ),
    ]
