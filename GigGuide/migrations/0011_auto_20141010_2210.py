# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0010_auto_20141010_2134'),
    ]

    operations = [
        migrations.RenameField(
            model_name='gig',
            old_name='reference',
            new_name='reference_name',
        ),
    ]
