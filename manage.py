#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "Library"))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "JameForbes.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)