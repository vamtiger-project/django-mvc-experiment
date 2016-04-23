# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0004_auto_20141009_2237'),
    ]

    operations = [
        migrations.AddField(
            model_name='gig',
            name='cancelled',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
    ]
