#!/bin/bash
set -e

# Install root dependencies
npm install --legacy-peer-deps

# Install mobile dependencies
cd mobile && npm install --legacy-peer-deps
