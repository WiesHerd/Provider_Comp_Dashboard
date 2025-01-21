#!/bin/bash

# List of important directories to check
IMPORTANT_DIRS=(
    "src"
    "prisma"
    "public"
    "styles"
)

# List of important files to check
IMPORTANT_FILES=(
    "package.json"
    "tsconfig.json"
    "next.config.js"
    "tailwind.config.js"
    "postcss.config.js"
    "README.md"
)

echo "🔍 Checking for important files before commit..."

# Check directories
for dir in "${IMPORTANT_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Warning: Directory '$dir' is missing!"
        exit 1
    else
        echo "✅ Directory '$dir' present"
    fi
done

# Check files
for file in "${IMPORTANT_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Warning: File '$file' is missing!"
        exit 1
    else
        echo "✅ File '$file' present"
    fi
done

# Check if prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Warning: Prisma schema is missing!"
    exit 1
else
    echo "✅ Prisma schema present"
fi

# Check for migrations
if [ ! -d "prisma/migrations" ]; then
    echo "❌ Warning: No Prisma migrations found!"
    exit 1
else
    echo "✅ Prisma migrations present"
fi

echo "✨ All important files are present!" 