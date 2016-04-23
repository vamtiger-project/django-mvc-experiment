# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    replaces = [(b'GigGuide', '0001_initial')]

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Gig',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('date', models.DateField()),
                ('starTime', models.TimeField()),
                ('endTime', models.TimeField()),
                ('venue', models.TextField()),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
