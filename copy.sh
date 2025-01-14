#!/bin/bash

# Check if pbcopy is available (macOS)
if ! command -v pbcopy &> /dev/null
then
  echo "pbcopy is not available. Please install it (if on macOS) or use a different method for clipboard access."
  exit 1
fi

# Check if the files exist, before attempting to copy them

if [ ! -f "index.html" ]; then
  echo "Error: index.html not found in current directory"
  exit 1
fi
if [ ! -f "styles.css" ]; then
    echo "Error: styles.css not found in current directory"
    exit 1
fi
if [ ! -f "scripts.js" ]; then
    echo "Error: scripts.js not found in current directory"
    exit 1
fi

# Copy the contents of the files to the clipboard with separators
{
  echo "Content of index.html:"
  cat index.html
  echo ""
  echo "Content of styles.css:"
  cat styles.css
  echo ""
  echo "Content of scripts.js:"
  cat scripts.js
} | pbcopy

echo "Contents of index.html, styles.css, and scripts.js copied to the clipboard with separators."

exit 0