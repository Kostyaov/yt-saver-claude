#!/usr/bin/env python3
"""
Generate extension icons using PIL/Pillow
Usage: python3 generate_icons.py
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is not installed.")
    print("Install it with: pip3 install Pillow")
    exit(1)

def draw_icon(size):
    """Draw bookmark icon on red circle background"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw red circle background
    draw.ellipse([0, 0, size-1, size-1], fill='#FF0000')

    # Calculate book dimensions
    book_width = size * 0.5
    book_height = size * 0.6
    book_x = (size - book_width) / 2
    book_y = (size - book_height) / 2

    # Draw white book rectangle
    draw.rectangle(
        [book_x, book_y, book_x + book_width, book_y + book_height],
        fill='#FFFFFF'
    )

    # Draw red line in middle (book spine)
    spine_width = size * 0.04
    spine_x = book_x + book_width/2 - spine_width/2
    draw.rectangle(
        [spine_x, book_y, spine_x + spine_width, book_y + book_height],
        fill='#FF0000'
    )

    # Draw gold bookmark ribbon
    ribbon_width = size * 0.08
    ribbon_x = book_x + book_width * 0.7
    ribbon_height = book_height * 0.7

    # Ribbon rectangle
    draw.rectangle(
        [ribbon_x, book_y, ribbon_x + ribbon_width, book_y + ribbon_height],
        fill='#FFD700'
    )

    # Ribbon triangle (point)
    triangle_y = book_y + ribbon_height
    triangle_bottom = book_y + book_height * 0.85
    draw.polygon([
        (ribbon_x, triangle_y),
        (ribbon_x + ribbon_width, triangle_y),
        (ribbon_x + ribbon_width/2, triangle_bottom)
    ], fill='#FFD700')

    return img

def main():
    """Generate all icon sizes"""
    sizes = [16, 48, 128]

    for size in sizes:
        print(f"Generating icon{size}.png...")
        icon = draw_icon(size)
        icon.save(f'icon{size}.png', 'PNG')
        print(f"✓ icon{size}.png created")

    print("\n✓ All icons generated successfully!")
    print("Icons created: icon16.png, icon48.png, icon128.png")

if __name__ == '__main__':
    main()
