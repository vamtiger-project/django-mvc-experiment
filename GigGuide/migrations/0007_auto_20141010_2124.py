# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0006_gig_reference'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='gig',
            options={'ordering': ['date']},
        ),
    ]
