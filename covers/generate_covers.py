#!/usr/bin/env python3
"""Generate Dev.to cover images with gradient backgrounds and title text."""

from PIL import Image, ImageDraw, ImageFont
import textwrap
import os

WIDTH, HEIGHT = 1000, 420

# Different gradient color schemes for variety
GRADIENTS = [
    [(26, 26, 46), (22, 33, 62), (15, 52, 96)],       # Deep blue
    [(30, 15, 45), (60, 20, 80), (100, 30, 120)],      # Purple
    [(10, 40, 40), (15, 60, 60), (20, 90, 90)],        # Teal
    [(45, 20, 20), (80, 30, 30), (120, 40, 40)],       # Deep red
    [(20, 35, 20), (30, 60, 35), (40, 90, 50)],        # Forest green
    [(40, 25, 10), (70, 40, 15), (110, 60, 20)],       # Bronze
    [(15, 25, 50), (25, 45, 85), (35, 65, 120)],       # Ocean blue
    [(35, 15, 35), (65, 25, 55), (95, 35, 75)],        # Magenta
    [(20, 30, 35), (35, 55, 60), (50, 80, 85)],        # Slate teal
    [(40, 20, 30), (70, 35, 50), (100, 50, 70)],       # Rose
]

ARTICLES = [
    ("3264127", "How I Set Up an AI Agent That Runs 24/7 on a Mac Mini", "how-i-set-up-an-ai-agent-that-runs-247-on-a-mac-mini-openclaw-cron-jobs-5g72"),
    ("3278187", "10 Git Commands That Even Senior Developers Google Every Week", "10-git-commands-that-even-senior-developers-google-every-week-5f13"),
    ("3277429", "12 Frontend Interview Questions That Senior Devs Still Get Wrong", "12-frontend-interview-questions-that-senior-devs-still-get-wrong-3k55"),
    ("3278426", "7 Productivity Hacks That 10x Your Developer Output", "7-productivity-hacks-that-10x-your-developer-output-with-real-examples-1ng7"),
    ("3262871", "I Shipped 18 Micro Tools and 27 Browser Games — Nobody Came", "i-shipped-18-micro-tools-and-27-browser-games-nobody-came-what-am-i-doing-wrong-1jb9"),
    ("3263706", "I Built 50 Automation Scripts in One Day. Here's Why Most Were Useless.", "i-built-50-automation-scripts-in-one-day-heres-why-most-were-useless-28ph"),
    ("3277079", "10 Algorithm Patterns That Solve 80% of Coding Interview Problems", "10-algorithm-patterns-that-solve-80-of-coding-interview-problems-59fb"),
    ("3265116", "I Built 50 Automation Scripts in One Day. Here's What Actually Worked.", "i-built-50-automation-scripts-in-one-day-heres-what-actually-worked-3pi1"),
    ("3265444", "3 Automation Patterns That Save Me 6+ Hours Every Week", "3-automation-patterns-that-save-me-6-hours-every-week-as-a-solo-dev-dfj"),
    ("3276673", "How I Prepared My Show HN Launch — A Solo Dev Checklist", "how-i-prepared-my-show-hn-launch-a-solo-dev-checklist-3fh0"),
]

def create_gradient(draw, colors):
    """Create a vertical gradient with 3 color stops."""
    c1, c2, c3 = colors
    for y in range(HEIGHT):
        if y < HEIGHT // 2:
            ratio = y / (HEIGHT // 2)
            r = int(c1[0] + (c2[0] - c1[0]) * ratio)
            g = int(c1[1] + (c2[1] - c1[1]) * ratio)
            b = int(c1[2] + (c2[2] - c1[2]) * ratio)
        else:
            ratio = (y - HEIGHT // 2) / (HEIGHT // 2)
            r = int(c2[0] + (c3[0] - c2[0]) * ratio)
            g = int(c2[1] + (c3[1] - c2[1]) * ratio)
            b = int(c2[2] + (c3[2] - c2[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

def add_decorative_elements(draw, colors):
    """Add subtle geometric decorations."""
    accent = tuple(min(c + 40, 255) for c in colors[2])
    # Corner accents
    for i in range(3):
        offset = i * 8
        draw.line([(20 + offset, 20), (60 + offset, 20)], fill=(*accent, 80), width=2)
        draw.line([(20, 20 + offset), (20, 60 + offset)], fill=(*accent, 80), width=2)
    # Bottom right
    for i in range(3):
        offset = i * 8
        draw.line([(WIDTH - 60 - offset, HEIGHT - 20), (WIDTH - 20 - offset, HEIGHT - 20)], fill=(*accent, 80), width=2)

def get_font(size):
    """Try to load a nice font, fall back to default."""
    font_paths = [
        "/System/Library/Fonts/SFCompact.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                continue
    return ImageFont.load_default()

def generate_cover(title, slug, gradient_idx):
    """Generate a single cover image."""
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)
    
    colors = GRADIENTS[gradient_idx % len(GRADIENTS)]
    create_gradient(draw, colors)
    add_decorative_elements(draw, colors)
    
    # Title text
    title_font = get_font(38)
    watermark_font = get_font(18)
    
    # Word wrap
    wrapped = textwrap.fill(title, width=35)
    lines = wrapped.split('\n')
    
    # Calculate vertical position (center)
    line_height = 50
    total_height = len(lines) * line_height
    start_y = (HEIGHT - total_height) // 2 - 20
    
    # Draw title with shadow
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=title_font)
        text_width = bbox[2] - bbox[0]
        x = (WIDTH - text_width) // 2
        y = start_y + i * line_height
        # Shadow
        draw.text((x + 2, y + 2), line, fill=(0, 0, 0, 128), font=title_font)
        # Main text
        draw.text((x, y), line, fill=(255, 255, 255), font=title_font)
    
    # Watermark
    wm_text = "MaxMini Dev"
    wm_bbox = draw.textbbox((0, 0), wm_text, font=watermark_font)
    wm_x = (WIDTH - (wm_bbox[2] - wm_bbox[0])) // 2
    draw.text((wm_x, HEIGHT - 45), wm_text, fill=(255, 255, 255, 180), font=watermark_font)
    
    # Subtle line separator above watermark
    accent = tuple(min(c + 60, 255) for c in colors[2])
    draw.line([(WIDTH // 4, HEIGHT - 55), (3 * WIDTH // 4, HEIGHT - 55)], fill=accent, width=1)
    
    filename = f"cover-{slug[:60]}.png"
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
    img.save(filepath, 'PNG')
    print(f"Created: {filename}")
    return filename

if __name__ == '__main__':
    for idx, (article_id, title, slug) in enumerate(ARTICLES):
        generate_cover(title, slug, idx)
    print(f"\nDone! Generated {len(ARTICLES)} cover images.")
