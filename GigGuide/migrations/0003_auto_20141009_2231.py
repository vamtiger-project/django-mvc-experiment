# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GigGuide', '0002_auto_20141009_2215'),
    ]

    operations = [
        migrations.AddField(
            model_name='gig',
            name='invoice',
            field=models.FloatField(default=0.0),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='gig',
            name='notes',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='gig',
            name='paid',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='gig',
            name='endTime',
            field=models.TimeField(blank=True),
        ),
        migrations.AlterField(
            model_name='gig',
            name='startTime',
            field=models.TimeField(blank=True),
        ),
        migrations.AlterField(
            model_name='gig',
            name='venue',
            field=models.CharField(max_length=100),
        ),
    ]
