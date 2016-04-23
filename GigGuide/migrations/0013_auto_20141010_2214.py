# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0012_auto_20141010_2213'),
    ]

    operations = [
        migrations.RenameField(
            model_name='gig',
            old_name='reference_name',
            new_name='reference',
        ),
        migrations.RenameField(
            model_name='gig',
            old_name='reference_tel',
            new_name='reference_telephone',
        ),
    ]
