#!/usr/bin/env bash
# Render build script for ProtoPatch Django backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --run-syncdb --no-input
